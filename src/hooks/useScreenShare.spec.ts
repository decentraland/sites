import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import { captureException, captureMessage } from '@sentry/browser'
import { act, renderHook } from '@testing-library/react'
import { ConnectionState } from 'livekit-client'
import { useLocalVideoTracks } from './useLocalVideoTracks'
import { useScreenShare } from './useScreenShare'

jest.mock('@sentry/browser', () => ({ captureException: jest.fn(), captureMessage: jest.fn() }))
jest.mock('@livekit/components-react', () => ({ useLocalParticipant: jest.fn(), useConnectionState: jest.fn() }))
jest.mock('./useLocalVideoTracks', () => ({ useLocalVideoTracks: jest.fn() }))

const showMock = jest.fn()
jest.mock('../features/cast2/contexts/NotificationContext', () => ({
  useNotifications: () => ({ show: showMock, dismiss: jest.fn(), notifications: [] })
}))
jest.mock('../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

const mockUseLocalParticipant = useLocalParticipant as jest.Mock
const mockUseConnectionState = useConnectionState as jest.Mock
const mockUseLocalVideoTracks = useLocalVideoTracks as jest.Mock

// Lets pending await chains (setScreenShareEnabled, etc.) settle before asserting.
const flush = () =>
  act(async () => {
    await Promise.resolve()
  })

// A real MediaStreamTrack is an EventTarget, and the hook subscribes to its `ended`
// event, so the stand-in has to record handlers rather than just expose getSettings.
// `emit` stands in for the browser firing the event when the capture source stops.
const makeMediaStreamTrack = () => {
  const listeners: Record<string, (() => void)[]> = {}
  return {
    getSettings: () => ({ width: 3024, height: 1964, frameRate: 30 }),
    addEventListener: (type: string, handler: () => void) => {
      listeners[type] = [...(listeners[type] ?? []), handler]
    },
    emit: (type: string) => (listeners[type] ?? []).forEach(handler => handler())
  }
}

let mediaStreamTrack: ReturnType<typeof makeMediaStreamTrack>

const makeParticipant = (overrides = {}) => ({
  setScreenShareEnabled: jest.fn().mockResolvedValue(undefined),
  unpublishTrack: jest.fn().mockResolvedValue(undefined),
  getTrackPublication: jest.fn().mockReturnValue({ track: { mediaStreamTrack } }),
  ...overrides
})

describe('useScreenShare', () => {
  let participant: ReturnType<typeof makeParticipant>

  beforeEach(() => {
    mediaStreamTrack = makeMediaStreamTrack()
    participant = makeParticipant()
    mockUseLocalParticipant.mockReturnValue({ localParticipant: participant })
    mockUseConnectionState.mockReturnValue(ConnectionState.Connected)
    mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Macintosh)' })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getDisplayMedia: jest.fn() } })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when not sharing', () => {
    it('should report isScreenSharing=false', () => {
      const { result } = renderHook(() => useScreenShare())
      expect(result.current.isScreenSharing).toBe(false)
    })
  })

  describe('when starting screen share on a desktop browser', () => {
    it('should enable screen share with audio and snapshot track stats', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      expect(participant.setScreenShareEnabled).toHaveBeenCalledWith(true, { audio: true })
    })
  })

  describe('when starting without a local participant', () => {
    beforeEach(() => {
      mockUseLocalParticipant.mockReturnValue({ localParticipant: null })
    })

    it('should not show a toast and bail out early', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      expect(showMock).not.toHaveBeenCalled()
    })
  })

  describe('when starting on a mobile user agent', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'iPhone' })
    })

    it('should show a not-supported toast and not enable screen share', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      expect(showMock).toHaveBeenCalledWith('ScreenShareFailed', { message: 'streaming_controls.screen_share_mobile_not_supported' })
      expect(participant.setScreenShareEnabled).not.toHaveBeenCalled()
    })
  })

  describe('when getDisplayMedia is unavailable', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {} })
    })

    it('should show a not-supported toast', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      expect(showMock).toHaveBeenCalledWith('ScreenShareFailed', { message: 'streaming_controls.screen_share_not_supported' })
    })
  })

  describe('when the browser denies the screen-share permission', () => {
    beforeEach(() => {
      const err = new Error('denied')
      err.name = 'NotAllowedError'
      participant.setScreenShareEnabled.mockRejectedValue(err)
    })

    it('should show a permission-denied toast', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      await flush()
      expect(showMock).toHaveBeenCalledWith('ScreenShareFailed', { message: 'streaming_controls.screen_share_permission_denied' })
    })

    it('should NOT report to Sentry, since declining is a user choice', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      await flush()
      expect(captureException).not.toHaveBeenCalled()
    })
  })

  describe('when the screen-share start raises NotSupportedError', () => {
    beforeEach(() => {
      const err = new Error('nope')
      err.name = 'NotSupportedError'
      participant.setScreenShareEnabled.mockRejectedValue(err)
    })

    it('should show a not-supported toast', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      await flush()
      expect(showMock).toHaveBeenCalledWith('ScreenShareFailed', { message: 'streaming_controls.screen_share_not_supported' })
    })
  })

  describe('when the screen-share start raises a generic error', () => {
    beforeEach(() => {
      participant.setScreenShareEnabled.mockRejectedValue(new Error('boom'))
    })

    it('should show a generic toast with no message', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      await flush()
      expect(showMock).toHaveBeenCalledWith('ScreenShareFailed')
    })

    it('should still report to Sentry', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      await flush()
      expect(captureException).toHaveBeenCalledWith(expect.any(Error), { tags: { feature: 'cast', area: 'screen_share', step: 'start' } })
    })
  })

  // Only NotAllowedError is silenced, and the check reads `.name` off an Error. A
  // non-Error rejection has no name, so it must keep reaching Sentry even though it
  // shows no toast.
  describe('when the screen-share start rejects with a non-Error value', () => {
    beforeEach(() => {
      participant.setScreenShareEnabled.mockRejectedValue('just a string')
    })

    it('should report to Sentry without showing a toast', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      await flush()
      expect(showMock).not.toHaveBeenCalled()
      expect(captureException).toHaveBeenCalledWith('just a string', {
        tags: { feature: 'cast', area: 'screen_share', step: 'start' }
      })
    })
  })

  // The browser's own "Stop sharing" bar, and closing the captured window, both end
  // the source track without going through stopScreenShare. That is a user decision,
  // so it must not surface as a failure (SITES-2PY).
  describe('when the capture source ends on its own while connected', () => {
    const stopFromTheBrowser = async () => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: true })
      const { result, rerender } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })

      await act(async () => {
        mediaStreamTrack.emit('ended')
      })
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
      rerender()
      await flush()
    }

    it('should not show a toast', async () => {
      await stopFromTheBrowser()
      expect(showMock).not.toHaveBeenCalled()
    })

    it('should not report to Sentry', async () => {
      await stopFromTheBrowser()
      expect(captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('when the screen-share track dies unexpectedly while connected', () => {
    it('should show a Retry toast and report to Sentry with stats', async () => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: true })
      const { result, rerender } = renderHook(() => useScreenShare())

      // record start stats (also marks intentionalStop=false)
      await act(async () => {
        await result.current.startScreenShare()
      })

      // track vanishes on its own
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
      rerender()
      await flush()

      expect(showMock).toHaveBeenCalledWith(
        'ScreenShareFailed',
        expect.objectContaining({
          message: 'notifications.screen_share_failed.stopped_message',
          action: expect.objectContaining({ label: 'notifications.retry' })
        })
      )
      expect(captureMessage).toHaveBeenCalledWith(
        'Screen share stopped unexpectedly',
        expect.objectContaining({
          level: 'warning',
          tags: { feature: 'cast', area: 'screen_share' },
          extra: expect.objectContaining({ width: 3024, height: 1964, frameRate: 30 })
        })
      )
    })

    it('should re-share when the Retry action is clicked', async () => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalScreenShare: true })
      const { result, rerender } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })
      participant.setScreenShareEnabled.mockClear()

      mockUseLocalVideoTracks.mockReturnValue({ hasLocalScreenShare: false })
      rerender()
      await flush()

      const action = showMock.mock.calls.at(-1)?.[1].action
      await act(async () => {
        action.onClick()
      })
      expect(participant.setScreenShareEnabled).toHaveBeenCalledWith(true, { audio: true })
    })
  })

  describe('when the user stops sharing intentionally', () => {
    it('should not show a toast on the resulting transition', async () => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalScreenShare: true })
      const { result, rerender } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.stopScreenShare()
      })
      expect(participant.unpublishTrack).toHaveBeenCalled()

      mockUseLocalVideoTracks.mockReturnValue({ hasLocalScreenShare: false })
      rerender()
      await flush()
      expect(showMock).not.toHaveBeenCalled()
    })
  })

  describe('when stopping with no active publication', () => {
    beforeEach(() => {
      participant.getTrackPublication.mockReturnValue(undefined)
    })

    it('should fall back to setScreenShareEnabled(false)', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.stopScreenShare()
      })
      expect(participant.setScreenShareEnabled).toHaveBeenCalledWith(false)
    })
  })

  describe('when stopping without a local participant', () => {
    beforeEach(() => {
      mockUseLocalParticipant.mockReturnValue({ localParticipant: null })
    })

    it('should bail out early', async () => {
      const { result } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.stopScreenShare()
      })
      expect(participant.unpublishTrack).not.toHaveBeenCalled()
    })
  })

  describe('when unpublishing the track throws', () => {
    beforeEach(() => {
      participant.unpublishTrack.mockRejectedValue(new Error('unpublish failed'))
    })

    it('should swallow the error without throwing', async () => {
      const { result } = renderHook(() => useScreenShare())
      await expect(
        act(async () => {
          await result.current.stopScreenShare()
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('when the whole connection drops', () => {
    it('should not show a screen-share toast on the transition', async () => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalScreenShare: true })
      mockUseConnectionState.mockReturnValue(ConnectionState.Connected)
      const { result, rerender } = renderHook(() => useScreenShare())
      await act(async () => {
        await result.current.startScreenShare()
      })

      mockUseConnectionState.mockReturnValue(ConnectionState.Disconnected)
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalScreenShare: false })
      rerender()
      await flush()
      expect(showMock).not.toHaveBeenCalled()
    })
  })
})

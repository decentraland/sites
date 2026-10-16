import React from 'react'
import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import { act, render, screen, within } from '@testing-library/react'
import { ConnectionState } from 'livekit-client'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { useLocalVideoTracks } from '../../../hooks/useLocalVideoTracks'
import { StreamerViewContent } from './StreamerViewContent'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({ useConnectionState: jest.fn(), useLocalParticipant: jest.fn() }))
jest.mock('../../../hooks/useLocalVideoTracks', () => ({ useLocalVideoTracks: jest.fn() }))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentationOptional: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('../ParticipantGrid/ParticipantGrid', () => ({
  ParticipantGrid: ({ presentationOverlay }: { presentationOverlay?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'participant-grid' }, presentationOverlay)
}))
jest.mock('../PresentationStage/PresentationStage', () => ({
  PresentationStage: ({ overlay }: { overlay?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'presentation-stage' }, overlay)
}))
jest.mock('../CameraOverlayHandle/CameraOverlayHandle', () => ({
  CameraOverlayHandle: () => React.createElement('div', { 'data-testid': 'camera-overlay-handle' })
}))
jest.mock('../LiveKitEnhancements/EmptyStreamState', () => ({
  EmptyStreamState: ({ message }: { message: string }) => React.createElement('div', { 'data-testid': message })
}))
jest.mock('../LiveStreamCounter/LiveStreamCounter', () => ({
  LiveStreamCounter: () => React.createElement('div')
}))

const mockUseConnectionState = useConnectionState as jest.Mock
const mockUseLocalVideoTracks = useLocalVideoTracks as jest.Mock
const mockUsePresentationOptional = usePresentationOptional as jest.Mock

const OVERLAY = { x: 0, y: 1, size: 'small' }
const legacy = { isPresentationActive: true, state: { slide: null, presenterIdentity: null, overlay: OVERLAY } }
const legacyWithoutOverlay = { isPresentationActive: true, state: { ...legacy.state, overlay: null } }
const composed = (presenterIdentity: string, overlay: typeof OVERLAY | null = OVERLAY) => ({
  isPresentationActive: true,
  state: { slide: { url: 'https://presenter.test/slides/ab12.png', width: 1920, height: 1080 }, presenterIdentity, overlay }
})

describe('when the streamer view renders', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseConnectionState.mockReturnValue(ConnectionState.Connected)
    ;(useLocalParticipant as jest.Mock).mockReturnValue({ localParticipant: { identity: '0xabc' } })
    mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
    mockUsePresentationOptional.mockReturnValue(null)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe.each([
    ['the room is still connecting', ConnectionState.Connecting, false, null, 'empty_state.camera_initializing', 0],
    ['the camera is off without a presentation', ConnectionState.Connected, false, null, 'empty_state.streamer_action', 0],
    ['the camera is off during a legacy presentation', ConnectionState.Connected, false, legacy, 'participant-grid', 0],
    ['the camera is on without a presentation', ConnectionState.Connected, true, null, 'participant-grid', 0],
    ['the camera is on during a legacy presentation', ConnectionState.Connected, true, legacy, 'participant-grid', 1],
    [
      'the camera is on during a presentation from a server without overlays',
      ConnectionState.Connected,
      true,
      legacyWithoutOverlay,
      'participant-grid',
      0
    ],
    [
      'the local participant presents a composed deck without an overlay',
      ConnectionState.Connected,
      true,
      composed('0xabc', null),
      'presentation-stage',
      0
    ],
    [
      'the local participant presents a composed deck on camera',
      ConnectionState.Connected,
      true,
      composed('0xabc'),
      'presentation-stage',
      1
    ],
    ['another participant presents a composed deck', ConnectionState.Connected, true, composed('0xdef'), 'presentation-stage', 0],
    ['the camera is off during a composed deck', ConnectionState.Connected, false, composed('0xabc'), 'presentation-stage', 0]
  ])('and %s past the init grace', (_, connectionState, hasLocalCamera, presentation, view, overlays) => {
    beforeEach(() => {
      mockUseConnectionState.mockReturnValue(connectionState)
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera, hasLocalScreenShare: false })
      mockUsePresentationOptional.mockReturnValue(presentation)
      render(<StreamerViewContent />)
      act(() => {
        jest.advanceTimersByTime(2000)
      })
    })

    it(`should render the ${view}`, () => {
      expect(screen.getByTestId(view)).toBeInTheDocument()
    })

    it(`should render ${overlays} camera overlay handle inside it`, () => {
      expect(within(screen.getByTestId(view)).queryAllByTestId('camera-overlay-handle')).toHaveLength(overlays)
    })
  })

  describe('and the connection drops while the camera is live', () => {
    beforeEach(() => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
      const { rerender } = render(<StreamerViewContent />)
      mockUseConnectionState.mockReturnValue(ConnectionState.Disconnected)
      rerender(<StreamerViewContent />)
    })

    it('should keep the participant grid', () => {
      expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
    })
  })
})

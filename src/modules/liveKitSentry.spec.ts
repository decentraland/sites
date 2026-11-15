const captureHandledErrorMock = jest.fn()

jest.mock('./captureHandledError', () => ({
  captureHandledError: (...args: unknown[]) => captureHandledErrorMock(...args)
}))

import { captureLiveKitConnectError } from './liveKitSentry'

const error = new Error('could not establish signal connection')

afterEach(() => {
  jest.resetAllMocks()
})

describe('when a room connection fails', () => {
  it('should tag the surface and the feature', async () => {
    await captureLiveKitConnectError(error, { surface: 'scene_watcher', serverUrl: 'wss://livekit.example' })

    expect(captureHandledErrorMock).toHaveBeenCalledWith(error, {
      tags: { surface: 'scene_watcher', host: 'livekit.example', feature: 'livekit' }
    })
  })

  it.each(['cast_watcher', 'cast_streamer'] as const)('should report the %s surface', async surface => {
    await captureLiveKitConnectError(error, { surface })

    expect(captureHandledErrorMock).toHaveBeenCalledWith(error, {
      tags: { surface, host: undefined, feature: 'livekit' }
    })
  })
})

// The room asks for camera and microphone as part of connecting, so a declined prompt
// arrives at `onError`. It is a choice, not a failure (SITES-2SP).
describe('when the visitor declined the camera or microphone', () => {
  it('should not report a DOMException-shaped denial', async () => {
    const denial = new Error('Permission denied')
    denial.name = 'NotAllowedError'

    await captureLiveKitConnectError(denial, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })

  // The room also hands over a plain Error wrapping the text.
  it.each(['NotAllowedError: Permission denied', 'Permission denied'])('should not report %s', async message => {
    await captureLiveKitConnectError(new Error(message), { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })

  it('should still report a genuine connection failure', async () => {
    await captureLiveKitConnectError(new Error('could not establish signal connection'), { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })

  it('should still report a thrown value that is not an Error', async () => {
    await captureLiveKitConnectError('Permission denied', { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })
})

// Another app holding the camera or microphone makes the browser refuse to start it. The
// room connects with the device off; freeing it is the streamer's to do (SITES-2T1, -2V2).
describe('when the camera or microphone is held by another app', () => {
  it('should not report a DOMException-shaped refusal', async () => {
    // A wording the message check doesn't know (Firefox's), so only the name can match it.
    const busy = new Error('Failed to allocate videosource')
    busy.name = 'NotReadableError'

    await captureLiveKitConnectError(busy, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })

  // The texts the room wrapped in a plain Error in SITES-2T1 and SITES-2V2, and the audio counterpart.
  it.each(['NotReadableError: Could not start video source', 'NotReadableError: Device in use', 'Could not start audio source'])(
    'should not report %s',
    async message => {
      await captureLiveKitConnectError(new Error(message), { surface: 'cast_streamer' })

      expect(captureHandledErrorMock).not.toHaveBeenCalled()
    }
  )
})

// A missing device is left reporting on purpose, for now.
describe('when no camera or microphone is present', () => {
  it('should still report a NotFoundError', async () => {
    const failure = new Error('device unavailable')
    failure.name = 'NotFoundError'

    await captureLiveKitConnectError(failure, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })
})

// The gatekeeper's envelope carries the access token as a query param.
describe('when the server url carries a query string', () => {
  it('should report the host without it', async () => {
    await captureLiveKitConnectError(error, { surface: 'scene_watcher', serverUrl: 'wss://livekit.example:8443?access_token=secret' })

    const [, options] = captureHandledErrorMock.mock.calls[0] as [unknown, { tags: Record<string, string> }]
    expect(options.tags.host).toBe('livekit.example:8443')
    expect(JSON.stringify(options)).not.toContain('secret')
  })
})

describe('when the server url is missing or unparseable', () => {
  it.each([
    ['undefined', undefined],
    ['an empty string', ''],
    ['a bare host', 'livekit.example']
  ])('should report no host for %s', async (_label, serverUrl) => {
    await captureLiveKitConnectError(error, { surface: 'scene_watcher', serverUrl })

    const [, options] = captureHandledErrorMock.mock.calls[0] as [unknown, { tags: Record<string, string | undefined> }]
    expect(options.tags.host).toBeUndefined()
  })
})

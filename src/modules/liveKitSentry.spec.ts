const captureHandledErrorMock = jest.fn()

jest.mock('./captureHandledError', () => ({
  captureHandledError: (...args: unknown[]) => captureHandledErrorMock(...args)
}))

import { ConnectionError, ConnectionErrorReason } from 'livekit-client'
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

  // No device and a busy device are left reporting on purpose, for now.
  it.each(['NotFoundError', 'NotReadableError'])('should still report a %s', async name => {
    const failure = new Error('device unavailable')
    failure.name = name

    await captureLiveKitConnectError(failure, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })
})

describe('when the page aborted the connection attempt itself', () => {
  // What `Room.disconnect()` rejects a pending connect with (SITES-2SS).
  it('should not report a client initiated disconnect', async () => {
    await captureLiveKitConnectError(ConnectionError.cancelled('Client initiated disconnect'), { surface: 'scene_watcher' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })

  // What `Room.connect()` throws when the room's own abort signal fired: the wrapper
  // keeps the inner Cancelled reason.
  it('should not report a signal connection the room aborted', async () => {
    const aborted = ConnectionError.cancelled('Signal connection aborted: Abort connection attempt due to user initiated disconnect')

    await captureLiveKitConnectError(aborted, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })
})

describe('when the signal connection failed', () => {
  // A signal websocket that never answers goes through the abort handler, so the
  // wrapper carries the Cancelled reason even though nothing cancelled it.
  it('should report a signal timeout that carries the Cancelled reason', async () => {
    // `Room.connect()` copies the inner reason onto its serverUnreachable wrapper.
    const timedOut: ConnectionError = ConnectionError.serverUnreachable('could not establish signal connection: Abort handler called')
    timedOut.reason = ConnectionErrorReason.Cancelled

    await captureLiveKitConnectError(timedOut, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })

  it('should report a cancellation with any other message', async () => {
    await captureLiveKitConnectError(ConnectionError.cancelled('Abort handler called'), { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })

  it('should report a websocket error', async () => {
    const websocket = ConnectionError.websocket(
      'could not establish signal connection: Encountered websocket error during connection establishment'
    )

    await captureLiveKitConnectError(websocket, { surface: 'scene_watcher' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })

  it('should report a signal connection the server never answered', async () => {
    const unreachable = ConnectionError.serverUnreachable('could not establish signal connection')

    await captureLiveKitConnectError(unreachable, { surface: 'cast_streamer' })

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

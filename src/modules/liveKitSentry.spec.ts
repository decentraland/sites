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

// The gatekeeper's envelope carries the access token as a query param.
describe('when the page aborted the connection attempt itself', () => {
  it('should not report the cancellation', async () => {
    await captureLiveKitConnectError(ConnectionError.cancelled('Abort handler called'), { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })

  // What reaches onError: livekit-client wraps the cancellation as "could not establish
  // signal connection: Abort handler called" and keeps its Cancelled reason.
  it('should not report it once wrapped as a signal connection error', async () => {
    const wrapped = ConnectionError.serverUnreachable('could not establish signal connection: Abort handler called')
    wrapped.reason = ConnectionErrorReason.Cancelled

    await captureLiveKitConnectError(wrapped, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).not.toHaveBeenCalled()
  })

  it('should still report a signal connection the server never answered', async () => {
    const unreachable = ConnectionError.serverUnreachable('could not establish signal connection')

    await captureLiveKitConnectError(unreachable, { surface: 'cast_streamer' })

    expect(captureHandledErrorMock).toHaveBeenCalledTimes(1)
  })
})

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

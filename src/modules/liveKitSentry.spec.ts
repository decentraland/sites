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

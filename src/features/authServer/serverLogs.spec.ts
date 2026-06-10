import type { ServerLogLine } from './serverLogs.types'

let mockSignedFetch: jest.Mock
let mockEnvUrl: string | undefined

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory:
    () =>
    (...args: unknown[]) =>
      mockSignedFetch(...args)
}))
jest.mock('../../config/env', () => ({ getEnv: () => mockEnvUrl }))

// Imported after the mocks so the module's `signedFetchFactory()` picks up the mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getMultiplayerServerUrl, parseLogLine, streamServerLogs } = require('./serverLogs') as typeof import('./serverLogs')

function fakeStreamResponse(chunks: string[], ok = true): Response {
  const encoder = new TextEncoder()
  let i = 0
  const body = {
    getReader: () => ({
      read: () =>
        i < chunks.length
          ? Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) })
          : Promise.resolve({ done: true, value: undefined })
    })
  }
  return { ok, status: ok ? 200 : 500, body } as unknown as Response
}

describe('serverLogs', () => {
  beforeEach(() => {
    mockSignedFetch = jest.fn()
    mockEnvUrl = 'https://multiplayer.test'
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getMultiplayerServerUrl', () => {
    it('should return the env URL when set', () => {
      expect(getMultiplayerServerUrl()).toBe('https://multiplayer.test')
    })

    it('should fall back to the prod URL when the env is unset', () => {
      mockEnvUrl = undefined
      expect(getMultiplayerServerUrl()).toBe('https://multiplayer-server.decentraland.org')
    })
  })

  describe('parseLogLine', () => {
    it('should parse a JSON line into timestamp/level/message', () => {
      const line = parseLogLine('{"timestamp":"2026-01-01T00:00:00.000Z","level":"error","message":"boom"}', 3, 1000)
      expect(line).toEqual({ id: 3, timestamp: Date.parse('2026-01-01T00:00:00.000Z'), level: 'error', message: 'boom' })
    })

    it('should normalize aliases (warning→warn, trace→info, time/msg/severity) and keep extra fields', () => {
      const line = parseLogLine('{"severity":"warning","msg":"hi","scene":"x"}', 0, 5000)
      expect(line?.level).toBe('warn')
      expect(line?.message).toBe('hi')
      expect(line?.extra).toBe('{"scene":"x"}')
    })

    it('should fall back to the receive time and info level for unknown levels / missing timestamp', () => {
      const line = parseLogLine('{"message":"plain"}', 1, 7000)
      expect(line).toEqual({ id: 1, timestamp: 7000, level: 'info', message: 'plain' })
    })

    it('should treat non-JSON content as a plain info message', () => {
      expect(parseLogLine('just text', 2, 8000)).toEqual({ id: 2, timestamp: 8000, level: 'info', message: 'just text' })
    })

    it('should strip an SSE data: prefix before parsing', () => {
      const line = parseLogLine('data: {"level":"debug","message":"d"}', 0, 0)
      expect(line).toEqual({ id: 0, timestamp: 0, level: 'debug', message: 'd' })
    })

    it('should ignore empty lines and SSE comments', () => {
      expect(parseLogLine('   ', 0, 0)).toBeNull()
      expect(parseLogLine(': keep-alive', 0, 0)).toBeNull()
      expect(parseLogLine('data:', 0, 0)).toBeNull()
    })
  })

  describe('streamServerLogs', () => {
    it('should sign a GET to /logs with the scene metadata and SSE accept header', async () => {
      mockSignedFetch.mockResolvedValue(fakeStreamResponse([]))
      const controller = new AbortController()
      await streamServerLogs({
        scope: { identity: { id: 'x' } as never, sceneId: 'w.dcl.eth', realmName: 'w.dcl.eth', parcel: '0,0' },
        signal: controller.signal,
        onLine: jest.fn(),
        onOpen: jest.fn()
      })
      expect(mockSignedFetch).toHaveBeenCalledWith(
        'https://multiplayer.test/logs',
        expect.objectContaining({
          method: 'GET',
          metadata: { parcel: '0,0', realmName: 'w.dcl.eth', sceneId: 'w.dcl.eth' },
          headers: { Accept: 'text/event-stream' }
        })
      )
    })

    it('should emit a parsed line per newline and call onOpen once', async () => {
      mockSignedFetch.mockResolvedValue(fakeStreamResponse(['{"message":"a"}\n{"message":"b"}\n', '{"message":"c"}\n']))
      const onLine = jest.fn<void, [ServerLogLine]>()
      const onOpen = jest.fn()
      await streamServerLogs({
        scope: { identity: {} as never, sceneId: 's', realmName: 'r', parcel: '0,0' },
        signal: new AbortController().signal,
        onLine,
        onOpen
      })
      expect(onOpen).toHaveBeenCalledTimes(1)
      expect(onLine.mock.calls.map(c => c[0].message)).toEqual(['a', 'b', 'c'])
    })

    it('should throw when the response is not ok', async () => {
      mockSignedFetch.mockResolvedValue(fakeStreamResponse([], false))
      await expect(
        streamServerLogs({
          scope: { identity: {} as never, sceneId: 's', realmName: 'r', parcel: '0,0' },
          signal: new AbortController().signal,
          onLine: jest.fn(),
          onOpen: jest.fn()
        })
      ).rejects.toThrow('server-logs request failed: 500')
    })
  })
})

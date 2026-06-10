import { act, renderHook } from '@testing-library/react'
import type { ServerLogLine, ServerLogsScope } from '../features/authServer'

interface StreamControls {
  onOpen: () => void
  onLine: (line: ServerLogLine) => void
  signal: AbortSignal
  resolve: () => void
  reject: () => void
}

let controls: StreamControls
const mockStream = jest.fn(
  (opts: { onOpen: () => void; onLine: (l: ServerLogLine) => void; signal: AbortSignal }) =>
    new Promise<void>((resolve, reject) => {
      controls = { onOpen: opts.onOpen, onLine: opts.onLine, signal: opts.signal, resolve, reject }
    })
)

jest.mock('../features/authServer', () => ({ streamServerLogs: (opts: unknown) => mockStream(opts as never) }))

// Imported after the mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useServerLogs } = require('./useServerLogs') as typeof import('./useServerLogs')

const scope = { identity: {}, sceneId: 's', realmName: 'r', parcel: '0,0' } as unknown as ServerLogsScope
const line = (id: number): ServerLogLine => ({ id, timestamp: id, level: 'info', message: `m${id}` })

// Capture the rAF callback so a test can flush the buffered lines on demand
// (real rAF is async — running it synchronously would mis-order the flush ref).
let rafCb: FrameRequestCallback | null = null
const flushRaf = () => act(() => rafCb?.(0))

describe('useServerLogs', () => {
  beforeEach(() => {
    rafCb = null
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      rafCb = cb
      return 1
    })
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should stay idle and open no stream when disabled', () => {
    const { result } = renderHook(() => useServerLogs({ scope, enabled: false }))
    expect(result.current.status).toBe('idle')
    expect(mockStream).not.toHaveBeenCalled()
  })

  it('should stay idle when enabled but no scope is available', () => {
    const { result } = renderHook(() => useServerLogs({ scope: null, enabled: true }))
    expect(result.current.status).toBe('idle')
    expect(mockStream).not.toHaveBeenCalled()
  })

  it('should connect, stream and accumulate lines', () => {
    const { result } = renderHook(() => useServerLogs({ scope, enabled: true }))
    expect(result.current.status).toBe('connecting')

    act(() => controls.onOpen())
    expect(result.current.status).toBe('streaming')

    act(() => {
      controls.onLine(line(0))
      controls.onLine(line(1))
    })
    flushRaf()
    expect(result.current.lines.map(l => l.id)).toEqual([0, 1])
  })

  it('should clear the accumulated lines', () => {
    const { result } = renderHook(() => useServerLogs({ scope, enabled: true }))
    act(() => {
      controls.onOpen()
      controls.onLine(line(0))
    })
    flushRaf()
    expect(result.current.lines).toHaveLength(1)
    act(() => result.current.clear())
    expect(result.current.lines).toHaveLength(0)
  })

  it('should surface an error when the stream ends naturally', async () => {
    const { result } = renderHook(() => useServerLogs({ scope, enabled: true }))
    await act(async () => {
      controls.resolve()
      await Promise.resolve()
    })
    expect(result.current.status).toBe('error')
  })

  it('should surface an error when the stream rejects', async () => {
    const { result } = renderHook(() => useServerLogs({ scope, enabled: true }))
    await act(async () => {
      controls.reject()
      await Promise.resolve()
    })
    expect(result.current.status).toBe('error')
  })

  it('should reopen the stream on reconnect', () => {
    const { result } = renderHook(() => useServerLogs({ scope, enabled: true }))
    expect(mockStream).toHaveBeenCalledTimes(1)
    act(() => result.current.reconnect())
    expect(mockStream).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('connecting')
  })

  it('should abort the stream on unmount', () => {
    const { unmount } = renderHook(() => useServerLogs({ scope, enabled: true }))
    expect(controls.signal.aborted).toBe(false)
    unmount()
    expect(controls.signal.aborted).toBe(true)
  })

  it('should cancel a pending flush frame on unmount', () => {
    const { unmount } = renderHook(() => useServerLogs({ scope, enabled: true }))
    // Buffer a line (schedules a flush frame) but do NOT flush it.
    act(() => {
      controls.onOpen()
      controls.onLine(line(0))
    })
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1)
  })
})

import { useCallback, useEffect, useRef, useState } from 'react'
import { streamServerLogs } from '../features/authServer'
import type { ServerLogLine, ServerLogsScope } from '../features/authServer'

type ServerLogsStatus = 'idle' | 'connecting' | 'streaming' | 'error'

// Keep the buffer bounded — the server can be chatty and we never want the DOM
// list to grow without limit.
const MAX_LINES = 500

interface UseServerLogsParams {
  scope: ServerLogsScope | null
  // When false the connection is closed (and never opened) — the AuthServerPage
  // sets this from the active tab + an explicit connect toggle so we don't hold
  // an SSE stream open while the user isn't watching it.
  enabled: boolean
}

interface UseServerLogsResult {
  status: ServerLogsStatus
  lines: ServerLogLine[]
  clear: () => void
  reconnect: () => void
}

// Owns the lifecycle of the signed `/logs` SSE stream: opens it only while
// `enabled` (and a scope is available), tears it down on disable/unmount, and
// accumulates a bounded line buffer.
function useServerLogs({ scope, enabled }: UseServerLogsParams): UseServerLogsResult {
  const [status, setStatus] = useState<ServerLogsStatus>('idle')
  const [lines, setLines] = useState<ServerLogLine[]>([])
  // Bumped to force the stream effect to re-run (retry after error / stream end).
  const [attempt, setAttempt] = useState(0)
  // Buffer incoming lines and flush on a frame so a burst doesn't trigger a
  // setState per line.
  const pendingRef = useRef<ServerLogLine[]>([])
  const flushRef = useRef<number | null>(null)

  const clear = useCallback(() => setLines([]), [])
  const reconnect = useCallback(() => setAttempt(value => value + 1), [])

  useEffect(() => {
    if (!enabled || !scope) {
      setStatus('idle')
      return
    }

    const controller = new AbortController()
    let cancelled = false
    setStatus('connecting')

    const flush = () => {
      flushRef.current = null
      if (pendingRef.current.length === 0) return
      const incoming = pendingRef.current
      pendingRef.current = []
      setLines(prev => {
        const next = prev.concat(incoming)
        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
      })
    }

    streamServerLogs({
      scope,
      signal: controller.signal,
      onOpen: () => {
        if (!cancelled) setStatus('streaming')
      },
      onLine: line => {
        pendingRef.current.push(line)
        if (flushRef.current == null) flushRef.current = window.requestAnimationFrame(flush)
      }
    })
      .then(() => {
        // Natural stream end (server closed it) while still enabled → treat as
        // an error so the user can reconnect.
        if (!cancelled) setStatus('error')
      })
      .catch(error => {
        // Most likely a CORS rejection or an aborted/closed stream. Log for
        // diagnosis; the UI shows a generic disconnected state (rule 10).
        if (!cancelled) {
          if (!controller.signal.aborted) console.warn('[serverLogs] stream failed', error)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
      controller.abort()
      if (flushRef.current != null) {
        window.cancelAnimationFrame(flushRef.current)
        flushRef.current = null
      }
      pendingRef.current = []
    }
  }, [enabled, scope, attempt])

  return { status, lines, clear, reconnect }
}

export { useServerLogs }
export type { ServerLogsStatus, UseServerLogsParams, UseServerLogsResult }

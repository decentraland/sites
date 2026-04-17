// Runs a callback when the browser is idle, falling back to setTimeout for
// environments without requestIdleCallback (Safari pre-17, older WebViews).
// Returns a handle that can be passed to `cancelScheduledIdleCall` to abort.

type ScheduledHandle = { kind: 'idle'; id: number } | { kind: 'timeout'; id: number }

interface ScheduleOptions {
  /** Max ms the browser may delay the callback before forcing it. Default: 4000. */
  timeout?: number
  /** Fallback delay when requestIdleCallback is unavailable. Default: 2000. */
  fallbackDelayMs?: number
}

function scheduleWhenIdle(cb: () => void, options: ScheduleOptions = {}): ScheduledHandle {
  const { timeout = 4000, fallbackDelayMs = 2000 } = options
  if (typeof window.requestIdleCallback === 'function') {
    return { kind: 'idle', id: window.requestIdleCallback(cb, { timeout }) }
  }
  return { kind: 'timeout', id: window.setTimeout(cb, fallbackDelayMs) }
}

function cancelScheduledIdleCall(handle: ScheduledHandle | undefined): void {
  if (!handle) return
  if (handle.kind === 'idle' && typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle.id)
  } else if (handle.kind === 'timeout') {
    window.clearTimeout(handle.id)
  }
}

export { cancelScheduledIdleCall, scheduleWhenIdle, type ScheduledHandle }

/**
 * Lazy Sentry shim — replaces the eager `@sentry/browser` import.
 *
 * @dcl/hooks imports `@sentry/browser` statically just to call
 * `captureException` on async errors. This shim defers loading the
 * real Sentry SDK until the first error occurs, removing ~111KB
 * from the critical path.
 *
 * Vite alias in vite.config.ts points `@sentry/browser` here.
 * The `sentry-shim-bypass` plugin ensures the dynamic import()
 * below resolves to the real SDK, not back to this shim.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryModule = any

let realSentry: SentryModule | null = null
let loading: Promise<SentryModule> | null = null

// Buffer init args so we can replay them when the real SDK loads
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pendingInit: any[] | null = null

function getRealSentry(): Promise<SentryModule> {
  if (!loading) {
    // Import via sentry-real.ts to bypass the Vite alias that points
    // @sentry/browser back to this shim. sentry-real.ts re-exports
    // the real SDK directly from node_modules.
    loading = import('./sentry-real')
      .then(m => {
        realSentry = m
        if (pendingInit) {
          m.init(pendingInit[0])
          pendingInit = null
        }
        return m
      })
      .catch(err => {
        loading = null // allow retry on next call
        console.error('[sentry-lazy] Failed to load SDK:', err)
        throw err
      })
  }
  return loading
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function captureException(exception: any, hint?: any) {
  if (realSentry) {
    realSentry.captureException(exception, hint)
  } else {
    getRealSentry()
      .then(s => s.captureException(exception, hint))
      .catch(() => console.error('[sentry-lazy] Error lost:', exception))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function captureMessage(message: string, level?: any) {
  if (realSentry) {
    realSentry.captureMessage(message, level)
  } else {
    getRealSentry()
      .then(s => s.captureMessage(message, level))
      .catch(() => console.error('[sentry-lazy] Message lost:', message))
  }
}

// Buffer init args — replay when the real SDK loads
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const init = (options?: any) => {
  pendingInit = [options]
}

const scopeStub = {
  setTag: () => {},
  setExtra: () => {},
  setUser: () => {},
  setLevel: () => {},
  addBreadcrumb: () => {}
}

// Re-export everything else as no-ops so `import * as Sentry` works
const setUser = () => {}
const setTag = () => {}
const setExtra = () => {}
const addBreadcrumb = () => {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withScope = (cb: (scope: any) => void) => cb(scopeStub)

export { init, setUser, setTag, setExtra, addBreadcrumb, withScope, captureMessage, captureException }

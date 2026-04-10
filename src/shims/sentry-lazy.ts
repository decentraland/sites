/**
 * Lazy Sentry shim — replaces the eager `@sentry/browser` import.
 *
 * @dcl/hooks imports `@sentry/browser` statically just to call
 * `captureException` on async errors. This shim defers loading the
 * real Sentry SDK until the first error occurs, removing ~111KB
 * from the critical path.
 *
 * Vite alias in vite.config.ts points `@sentry/browser` here.
 */

let realSentry: typeof import('@sentry/browser') | null = null
let loading: Promise<typeof import('@sentry/browser')> | null = null

function getRealSentry() {
  if (!loading) {
    loading = import('@sentry/browser').then(m => {
      realSentry = m
      return m
    })
  }
  return loading
}

function captureException(...args: Parameters<typeof import('@sentry/browser').captureException>) {
  if (realSentry) {
    realSentry.captureException(...args)
  } else {
    getRealSentry().then(s => s.captureException(...args))
  }
}

function captureMessage(...args: Parameters<typeof import('@sentry/browser').captureMessage>) {
  if (realSentry) {
    realSentry.captureMessage(...args)
  } else {
    getRealSentry().then(s => s.captureMessage(...args))
  }
}

// Re-export everything else as no-ops so `import * as Sentry` works
const init = () => {}
const setUser = () => {}
const setTag = () => {}
const setExtra = () => {}
const addBreadcrumb = () => {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withScope = (cb: (scope: any) => void) => cb({})

export { init, setUser, setTag, setExtra, addBreadcrumb, withScope, captureMessage, captureException }

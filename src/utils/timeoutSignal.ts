// `AbortSignal.timeout` shipped in Chrome 103, Safari 16, Firefox 100 and Edge 103.
// Anything older throws `AbortSignal.timeout is not a function` while the request is
// still being built, so the call never happens and the surrounding feature dies. That
// took the invite page down for 22 users (SITES-2NN), and the same call appears in the
// reels client, the CMS and events discovery clients, and the identity hook.
//
// `build.target` cannot help here: this is a runtime method, not syntax, so lowering
// the target emits no polyfill for it.
const TIMEOUT_ERROR_NAME = 'TimeoutError'

/**
 * An `AbortSignal` that aborts after `ms`, with a fallback for browsers that lack
 * `AbortSignal.timeout`.
 *
 * The fallback aborts with a `DOMException` named `TimeoutError`, which is what the
 * native method produces, so callers that branch on `error.name` see the same thing
 * either way.
 */
function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms)
  }

  const controller = new AbortController()
  setTimeout(() => {
    // `abort(reason)` is itself newer than AbortController; browsers that ignore the
    // argument still abort, which is the behaviour that matters.
    controller.abort(new DOMException('signal timed out', TIMEOUT_ERROR_NAME))
  }, ms)
  return controller.signal
}

export { timeoutSignal }

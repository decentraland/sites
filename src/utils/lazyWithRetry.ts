import { type ComponentType, type LazyExoticComponent, lazy } from 'react'

// Long enough for a transient blip to clear, short enough that a user staring at
// a blank route does not notice a second of extra wait.
const RETRY_DELAY_MS = 800

/**
 * `React.lazy` with a single retry.
 *
 * A dynamic import that rejects is terminal: React caches the rejection, so the
 * chunk is never re-requested even after the network recovers, and with no error
 * boundary above it the whole tree unmounts into a blank page.
 *
 * The failures we see in production are not missing chunks — the CDN keeps every
 * published version, so an old chunk still resolves long after a deploy. They are
 * client-side network failures, concentrated on flaky mobile and proxied
 * connections, which is exactly the shape one retry fixes.
 *
 * A retry that also fails rethrows, so the error boundary can report it once and
 * offer a reload. Retrying more than once would only delay that.
 */
// `any` mirrors React's own `lazy` signature. A narrower constraint (`unknown` or
// `never`) makes the returned component unassignable wherever it takes props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch(async (error: unknown) => {
      await new Promise(resolve => {
        setTimeout(resolve, RETRY_DELAY_MS)
      })
      return factory().catch(() => {
        // Rethrow the FIRST error: it is the one that describes the original
        // failure, and the retry's error is usually an identical duplicate.
        throw error
      })
    })
  )
}

export { lazyWithRetry }

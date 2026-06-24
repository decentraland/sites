import type { Page } from '@playwright/test'

/**
 * Status code used by `mockBlogApi` (mocks/blog.ts) when a CMS request reaches
 * the dispatcher but no handler matches it. Picked from the 5xx "unassigned"
 * range so it cannot be confused with a real upstream response (servers
 * return 500/502/503/504 in production, never 599).
 *
 * Pairs with `watchUnmockedCmsRequests` below: that listener fails the test
 * when it sees a response with this status, guaranteeing the suite never
 * silently passes by hitting prod.
 */
const UNMOCKED_CMS_STATUS = 599

// Third-party telemetry hosts the production bundle reaches. Each one keeps
// the network busy for seconds after the page is "loaded", which is why our
// initial `expect(...).toBeVisible()` calls used to need a 15s timeout — they
// were waiting behind deferred analytics, not behind real rendering.
//
// Aborting these at the route level shaves cold-load latency and removes the
// dominant source of flakes. Mirrors auth/e2e/helpers/setup.ts.
const THIRD_PARTY_HOSTS = [
  /\.segment\.io/,
  /cdn\.segment\.com/,
  /\.sentry\.io/,
  /\.contentsquare\.net/,
  /widget\.intercom\.io/,
  /\.intercomcdn\.com/,
  /\.hcaptcha\.com/
]

/**
 * Install a listener that records every CMS request the test forgot to mock.
 *
 * Contract:
 * - Call this in `beforeEach` BEFORE the first `page.goto`.
 * - Assert in `afterEach` that the returned `errors` array is empty.
 *
 * Why it lives here and not in the test runner: a `throw` from inside
 * `page.on('response', …)` does not propagate to Playwright — the test would
 * end "passing" with a noisy stack trace. Accumulating errors and asserting
 * later forces the failure to bubble up correctly.
 */
function watchUnmockedCmsRequests(page: Page): { errors: string[] } {
  const errors: string[] = []
  page.on('response', resp => {
    if (resp.status() === UNMOCKED_CMS_STATUS) errors.push(`Unmocked CMS request → ${resp.url()}`)
  })
  return { errors }
}

/**
 * Aborts requests to known third-party telemetry hosts. Call once in beforeEach
 * BEFORE the first goto so the abort is registered before React mounts.
 *
 * The browser sees the request as a network error and the analytics SDKs
 * silently swallow it — no rendering side effect. Speeds up cold loads and
 * eliminates the most common cause of flaky cross-domain timeouts.
 */
async function blockThirdParties(page: Page): Promise<void> {
  for (const host of THIRD_PARTY_HOSTS) {
    await page.route(host, route => route.abort())
  }
}

export { UNMOCKED_CMS_STATUS, blockThirdParties, watchUnmockedCmsRequests }

// Shared fixture for blog journeys. Pre-wires the unmocked-CMS sentinel and
// blocks third-party telemetry on every test, and asserts in teardown that
// no CMS request escaped the mock. Import `test, expect` from here instead
// of @playwright/test — `mockBlogApi(page, scenario)` still needs to be the
// FIRST `await` inside each test, before the first `page.goto`.

import { test as base, expect } from '@playwright/test'
import { blockThirdParties, watchUnmockedCmsRequests } from '../../mocks/shared'

type BlogFixtures = {
  /** Mutable collection of unmocked CMS URLs detected during the test. */
  unmocked: { errors: string[] }
}

const test = base.extend<BlogFixtures>({
  unmocked: async ({ page }, use) => {
    const unmocked = watchUnmockedCmsRequests(page)
    await blockThirdParties(page)
    await use(unmocked)
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  }
})

export { expect, test }

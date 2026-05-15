---
name: e2e-author
description: Use when adding or editing a Playwright E2E spec under e2e/specs/blog/. Triggers on "add e2e test", "new e2e spec", "escribir test e2e", "playwright spec", or edits to files in e2e/specs/. Establishes the mockBlogApi-before-goto pattern, semantic locator priority, and the unmocked-CMS-fails contract. Narrow scope: blog suite only — extend the skill before authoring specs for other features.
---

# e2e-author

Playbook for authoring a new spec inside the existing E2E suite. Follow these rules to avoid the flakiness modes that motivated the suite.

## The contract

1. **Mock before navigate.** Every spec calls `mockBlogApi(page, scenario)` BEFORE the first `page.goto(...)`. Registering `page.route` after navigation races against the first fetch.
2. **Fail on unmocked CMS requests.** Every spec activates `watchUnmockedCmsRequests(page)` in `beforeEach` and asserts the resulting `errors` array is empty in `afterEach`. Forgetting this lets a test pass against prod accidentally.
3. **Never use `waitForTimeout` or `waitForLoadState('networkidle')`.** The first is a smell; the second is broken for sites because deferred analytics (Segment / Contentsquare) keep the network busy for ~4s. Use `waitForRequest` / `waitForResponse` / `expect.poll`.
4. **Cold lazy chunk: timeout 15s on first assertion.** DappsShell is lazy-loaded; the first `expect(...).toBeVisible()` after `goto('/blog/...')` should pass `{ timeout: 15_000 }`. Subsequent assertions can use the default.

## Locator priority

Use locators in this order — drop down only when the previous tier doesn't disambiguate:

1. `page.getByRole(...)` — heading, link, button, searchbox.
2. `page.getByLabel(...)` — labeled form controls.
3. `page.getByText(...)` — visible text content.
4. `page.getByPlaceholder(...)` — inputs without a label.
5. `page.getByTestId(...)` — only for states with no accessible alternative (error/empty boxes, structural regions like `post-list`).

Existing `data-testid` whitelist (do not invent new ones without justification):

- `blog-error` — generic CMS error UI across Blog/Post/Category/Author pages.
- `post-list` — real post grid (PostList non-loading branch).
- `post-list-skeleton` — loading skeleton (PostList loading branch). Counting only `post-list` excludes skeletons.

## Adding a scenario

1. Extend `BlogScenario` in `e2e/mocks/types.ts` with the new variant.
2. Add a handler branch in `e2e/mocks/blog.ts`. Match on URL path/params; reuse `errorResponse`, `emptyListResponse`, or a fixture as needed.
3. Add or extend fixtures in `e2e/fixtures/blog/`. Build them via the factories in `cms-entry.factory.ts` — never inline raw JSON.
4. If the fixture introduces new IDs, run `npm run e2e:check-fixtures` to verify cross-reference resolution.

## Spec naming and shape

- File: `e2e/specs/<feature>/<aspect>.spec.ts`.
- Top-level `test.describe('<page route>')` block.
- One `test(...)` per scenario; group happy and bad paths together.
- Pre-test: `unmocked = watchUnmockedCmsRequests(page)`.
- Post-test: `expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])`.

## Anti-flake rules

- Use the Page Object in `e2e/pages/blog.page.ts` — never inline selectors inside specs.
- `npx playwright test -c e2e/playwright.config.ts e2e/specs/blog/<spec>.spec.ts` runs a single spec locally.
- Trace and video retain on failure are already configured in `e2e/playwright.config.ts`; download the `playwright-report` artifact from CI when a failure looks racy.

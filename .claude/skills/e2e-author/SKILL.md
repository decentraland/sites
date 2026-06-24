---
name: e2e-author
description: Use when adding or editing a Playwright E2E spec under e2e/specs/blog/. Triggers on "add e2e test", "new e2e spec", "escribir test e2e", "playwright spec", or edits to files in e2e/specs/. Establishes the user-journey pattern, mockBlogApi-before-goto contract, semantic locator priority, and the unmocked-CMS-fails contract. Narrow scope: blog suite only — extend the skill before authoring specs for other features.
---

# e2e-author

Playbook for authoring a new spec inside the existing E2E suite. The suite is organised by **user journey**, not by endpoint — each spec walks a real flow click-by-click. Follow these rules to avoid the flakiness modes that motivated the suite.

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
- `post-list` / `post-list-skeleton` — PostList grid in real / loading branches. Counting only `post-list` excludes skeletons.
- `post-card`, `post-card-skeleton` — PostCard root.
- `main-post-card`, `main-post-card-skeleton` — MainPostCard root (only renders on desktop with `hasMainPost`).
- `blog-navbar` — BlogNavigation root. Scope navbar links here so they don't collide with category meta links inside cards or post headers.
- `search-hit` — single `<SearchResultItem>` in the navbar dropdown. Distinguishes hit `<li>`s from CategoryItem `<li>`s.
- `post-title`, `post-body` — PostPage headline + rich-text body container. Use these instead of role-based heading lookups (RelatedPost renders its own headings).
- `post-category-meta`, `post-author` — links in the post header. Scoped so they don't collide with RelatedPost card links.
- `post-share`, `post-share-twitter`, `post-share-facebook` — Share intent CTAs in PostPage.
- `category-hero` — CategoryHero container in the category landing.
- `author-header` — AuthorHeaderBox in the author landing.
- `related-posts` — RelatedPost section in the post detail.

## Adding a scenario

1. Extend `BlogScenario` in `e2e/mocks/types.ts` with the new variant.
2. Add a handler branch in `e2e/mocks/blog.ts`. Match on URL path/params; reuse `errorResponse`, `emptyListResponse`, or a fixture as needed.
3. Add or extend fixtures in `e2e/fixtures/blog/`. Build them via the factories in `cms-entry.factory.ts` — never inline raw JSON.
4. If the fixture introduces new IDs, run `npm run e2e:check-fixtures` to verify cross-reference resolution.

## Spec naming and shape

- File: `e2e/specs/<feature>/journey-<flow>.spec.ts`. Each file walks **one** user journey end-to-end (multiple page transitions, real clicks).
- Top-level `test.describe('User journey: <flow>')` block.
- The happy path is a single long `test(...)` that walks every step. Bad paths (error states, not-found, etc.) are separate short tests within the same file.
- Avoid `page.goto` after the initial landing — every subsequent navigation should be a real click, scroll, or keyboard interaction. Tests that only `goto`-and-assert duplicate the unit specs.
- Pre-test: `unmocked = watchUnmockedCmsRequests(page)`.
- Post-test: `expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])`.

## Anti-flake rules

- Use the Page Object in `e2e/pages/blog.page.ts` — never inline selectors inside specs.
- `npx playwright test -c e2e/playwright.config.ts e2e/specs/blog/<spec>.spec.ts` runs a single spec locally.
- Trace and video retain on failure are already configured in `e2e/playwright.config.ts`; download the `playwright-report` artifact from CI when a failure looks racy.

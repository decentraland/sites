interface CaptureHandledErrorOptions {
  tags?: Record<string, string | undefined>
  extra?: Record<string, unknown>
}

/**
 * Reports an error we already handled in the UI to Sentry.
 *
 * Import order matters: `./sentry` is the side-effect module that calls `init()`
 * (deferred to idle by main.tsx, idempotent via the module cache), and
 * `captureException` before init is silently dropped — so the init import has to
 * resolve first. Both stay dynamic so the ~120 KB Sentry chunk is never pulled
 * eagerly into a caller's bundle.
 *
 * Everything is wrapped: a blocked or failed Sentry load must never break the
 * feature that was only trying to report. `undefined` tags are stripped so they
 * do not render as the literal string "undefined" in the Sentry UI.
 *
 * The catch is deliberately total, and that has a real consequence worth naming:
 * either dynamic import can fail independently (an ad blocker typically kills the
 * `@sentry/browser` request while `./sentry` resolves from cache), and when that
 * happens the report is lost with nothing to show for it. Staying silent is the
 * right call in production, since the caller already handled the error and a
 * reporting failure must not surface to the user. But a silent failure is also how
 * a genuinely broken reporting path hides, so outside production it warns.
 */
async function captureHandledError(error: unknown, { tags = {}, extra }: CaptureHandledErrorOptions = {}): Promise<void> {
  try {
    await import('./sentry')
    const { captureException } = await import('@sentry/browser')
    const definedTags = Object.fromEntries(Object.entries(tags).filter((entry): entry is [string, string] => entry[1] !== undefined))
    captureException(error, { tags: definedTags, extra })
  } catch (reportingError) {
    // `process.env.NODE_ENV` rather than the more idiomatic `import.meta.env.DEV`
    // on purpose: ts-jest cannot parse `import.meta` in CJS mode, so a module that
    // reads it can only be tested by mocking it away wholesale (see the comments in
    // cms.search.client.spec.ts and the discover specs). Vite still folds this to
    // `"production" !== "production"` at build time and drops the block, which was
    // verified against the emitted bundle: the string survives only in the .map.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[captureHandledError] failed to report to Sentry', reportingError, 'original error:', error)
    }
  }
}

export { captureHandledError }
export type { CaptureHandledErrorOptions }

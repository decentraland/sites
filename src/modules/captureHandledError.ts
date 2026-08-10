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
 */
async function captureHandledError(error: unknown, { tags = {}, extra }: CaptureHandledErrorOptions = {}): Promise<void> {
  try {
    await import('./sentry')
    const { captureException } = await import('@sentry/browser')
    const definedTags = Object.fromEntries(Object.entries(tags).filter((entry): entry is [string, string] => entry[1] !== undefined))
    captureException(error, { tags: definedTags, extra })
  } catch {
    // Sentry blocked or failed to load — never break the caller.
  }
}

export { captureHandledError }
export type { CaptureHandledErrorOptions }

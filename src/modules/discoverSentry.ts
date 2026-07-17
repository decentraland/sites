/**
 * Captures a discover-section network failure in Sentry. Mirrors
 * `downloadFunnelSentry`: `./sentry` is the side-effect init module (deferred
 * to idle by main.tsx; idempotent via the module cache) and must resolve
 * before `captureException`, and both stay dynamically imported so the
 * ~120 KB Sentry chunk is never pulled into the DappsShell bundle eagerly.
 * Everything is wrapped so a blocked/failed Sentry load can never break the
 * discover UI.
 */
async function captureDiscoverError(error: unknown, tags: Record<string, string | undefined>): Promise<void> {
  try {
    await import('./sentry')
    const { captureException } = await import('@sentry/browser')
    const definedTags = Object.fromEntries(Object.entries(tags).filter((entry): entry is [string, string] => entry[1] !== undefined))
    captureException(error, { tags: { feature: 'discover', ...definedTags } })
  } catch {
    // Sentry blocked or failed to load — never break the page.
  }
}

export { captureDiscoverError }

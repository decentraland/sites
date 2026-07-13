const MAX_MILESTONES = 20

interface Milestone {
  event: string
  at: number
}

const milestones: Milestone[] = []

/**
 * Records a download-funnel milestone in a local ring buffer.
 *
 * Deliberately NOT `Sentry.addBreadcrumb`: breadcrumbs are a no-op before
 * `init()` (which `main.tsx` defers to idle), and importing `@sentry/browser`
 * at each milestone would pull the ~120 KB chunk on every `/download_success`
 * visit. The buffer costs nothing until an error actually needs the context.
 */
function recordDownloadMilestone(event: string): void {
  if (milestones.length >= MAX_MILESTONES) {
    milestones.shift()
  }
  milestones.push({ event, at: Date.now() })
}

/**
 * Captures a download-funnel error in Sentry with the milestone buffer as
 * context. Import order matters: `./sentry` is the side-effect module that
 * calls `init()` (idempotent via the module cache), and `captureException`
 * before init is silently dropped — so the init import must resolve first.
 *
 * Everything is wrapped so a blocked/failed Sentry load can never break the
 * download flow. `undefined` tags are stripped so they don't render as the
 * literal string "undefined" in the Sentry UI.
 */
async function captureDownloadError(error: unknown, tags: Record<string, string | undefined>): Promise<void> {
  try {
    await import('./sentry')
    const { captureException } = await import('@sentry/browser')
    const definedTags = Object.fromEntries(Object.entries(tags).filter((entry): entry is [string, string] => entry[1] !== undefined))
    captureException(error, { tags: definedTags, extra: { milestones: [...milestones] } })
  } catch {
    // Sentry blocked or failed to load — never break the download flow.
  }
}

export { captureDownloadError, recordDownloadMilestone }

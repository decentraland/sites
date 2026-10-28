import { captureHandledError } from './captureHandledError'

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

/** Captures a download-funnel error in Sentry with the milestone buffer as context. */
async function captureDownloadError(error: unknown, tags: Record<string, string | undefined>): Promise<void> {
  await captureHandledError(error, { tags, extra: { milestones: [...milestones] } })
}

export { captureDownloadError, recordDownloadMilestone }

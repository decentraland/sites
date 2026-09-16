import { captureHandledError } from './captureHandledError'

/**
 * Captures a discover-section network failure in Sentry, tagged for the feature.
 *
 * `feature` goes after the spread so a caller cannot drop it. Before the spread it
 * would be overwritable, and passing `{ feature: undefined }` would then be stripped
 * downstream as an undefined tag, losing the feature tag entirely.
 */
async function captureDiscoverError(error: unknown, tags: Record<string, string | undefined>): Promise<void> {
  await captureHandledError(error, { tags: { ...tags, feature: 'discover' } })
}

export { captureDiscoverError }

import { captureHandledError } from './captureHandledError'

/** Captures a discover-section network failure in Sentry, tagged for the feature. */
async function captureDiscoverError(error: unknown, tags: Record<string, string | undefined>): Promise<void> {
  await captureHandledError(error, { tags: { feature: 'discover', ...tags } })
}

export { captureDiscoverError }

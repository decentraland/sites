import { getAnalytics } from '@dcl/hooks'
import { createAnonymousIdResolver } from './segmentAnonymousId.helpers'

// AnalyticsBrowser.user() is asynchronous even after boot. Only its resolved
// instance has the synchronous identity getter needed during navigation/unload.
const resolver = createAnonymousIdResolver(() => getAnalytics()?.instance?.user().anonymousId() ?? undefined)

const ensureSegmentAnonymousId = resolver.ensure
const readSegmentAnonymousId = resolver.read

export { ensureSegmentAnonymousId, readSegmentAnonymousId }
export { generateUuid } from './segmentAnonymousId.helpers'

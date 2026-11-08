import { readStorageItem, writeStorageItem } from '../utils/safeStorage'
import { UUID_V1_5_RE, generateUuid } from './segmentAnonymousId.helpers'

const ATTRIBUTION_KEY = 'dcl_gateway_anon_user_id'

/** Keeps gateway UUID attribution stable without changing a custom Segment identity. */
function createGatewayAnonymousIdResolver() {
  let memorySegmentId: string | undefined
  let memoryAttributionId: string | undefined

  return (segmentId: string): string => {
    if (UUID_V1_5_RE.test(segmentId)) return segmentId
    try {
      const stored: unknown = JSON.parse(readStorageItem(ATTRIBUTION_KEY) || 'null')
      if (
        stored &&
        typeof stored === 'object' &&
        'segmentId' in stored &&
        stored.segmentId === segmentId &&
        'attributionId' in stored &&
        typeof stored.attributionId === 'string' &&
        UUID_V1_5_RE.test(stored.attributionId)
      ) {
        memorySegmentId = segmentId
        memoryAttributionId = stored.attributionId
        return memoryAttributionId
      }
    } catch {
      // Corrupt or blocked storage must not break downloads.
    }
    if (memorySegmentId !== segmentId || !memoryAttributionId) {
      memorySegmentId = segmentId
      memoryAttributionId = generateUuid()
    }
    // The storage wrapper tolerates WebViews without storage; memory keeps retries stable.
    writeStorageItem(ATTRIBUTION_KEY, JSON.stringify({ segmentId, attributionId: memoryAttributionId }))
    return memoryAttributionId
  }
}

export { createGatewayAnonymousIdResolver }

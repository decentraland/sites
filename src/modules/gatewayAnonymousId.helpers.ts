import { GATEWAY_UUID_RE, generateUuid } from './segmentAnonymousId.helpers'

const ATTRIBUTION_KEY = 'dcl_gateway_anon_user_id'

/** Keeps gateway UUID attribution stable without changing a custom Segment identity. */
function createGatewayAnonymousIdResolver() {
  let memorySegmentId: string | undefined
  let memoryAttributionId: string | undefined

  return (segmentId: string): string => {
    if (GATEWAY_UUID_RE.test(segmentId)) return segmentId
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || 'null')
      if (
        stored &&
        typeof stored === 'object' &&
        'segmentId' in stored &&
        stored.segmentId === segmentId &&
        'attributionId' in stored &&
        typeof stored.attributionId === 'string' &&
        GATEWAY_UUID_RE.test(stored.attributionId)
      ) {
        memorySegmentId = segmentId
        memoryAttributionId = stored.attributionId
      }
    } catch {
      // Corrupt or blocked storage must not break downloads.
    }
    if (memorySegmentId !== segmentId || !memoryAttributionId) {
      memorySegmentId = segmentId
      memoryAttributionId = generateUuid()
    }
    try {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({ segmentId, attributionId: memoryAttributionId }))
    } catch {
      // Keep retries stable within this page when storage is unavailable.
    }
    return memoryAttributionId
  }
}

export { createGatewayAnonymousIdResolver }

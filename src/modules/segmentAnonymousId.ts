const ANON_ID_KEY = 'ajs_anonymous_id'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

/**
 * Returns a Segment-adoptable anonymous id. If Segment has not booted yet, this
 * mints and persists the same JSON-encoded localStorage shape analytics-next
 * writes, so the later Segment instance adopts it.
 */
function ensureSegmentAnonymousId(): string {
  try {
    const raw = localStorage.getItem(ANON_ID_KEY)
    if (raw) {
      const parsed = safeParseStoredId(raw)
      if (parsed && UUID_RE.test(parsed)) return parsed
    }

    const id = generateUuid()
    localStorage.setItem(ANON_ID_KEY, JSON.stringify(id))
    return id
  } catch {
    return generateUuid()
  }
}

function safeParseStoredId(value: string): string | undefined {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'string' ? parsed : undefined
  } catch {
    return value
  }
}

export { ensureSegmentAnonymousId, generateUuid, safeParseStoredId }

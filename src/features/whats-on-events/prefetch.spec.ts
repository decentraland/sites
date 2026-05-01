import { consumeWhatsOnPrefetch } from './prefetch'

const EVENTS_URL = 'https://events.test/api/events?list=live'
const SCENES_URL = 'https://realm.test/hot-scenes'

describe('consumeWhatsOnPrefetch', () => {
  beforeEach(() => {
    delete window.__dclWhatsOnPrefetch
  })

  describe('when no prefetch is on the window', () => {
    it('should return null', () => {
      expect(consumeWhatsOnPrefetch(EVENTS_URL, SCENES_URL)).toBeNull()
    })
  })

  describe('when the prefetch URLs do not match', () => {
    let result: ReturnType<typeof consumeWhatsOnPrefetch>

    beforeEach(() => {
      window.__dclWhatsOnPrefetch = {
        eventsUrl: 'https://other.test/events',
        scenesUrl: SCENES_URL,
        events: Promise.resolve(null),
        scenes: Promise.resolve(null)
      }
      result = consumeWhatsOnPrefetch(EVENTS_URL, SCENES_URL)
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })

    it('should leave the prefetch on the window', () => {
      expect(window.__dclWhatsOnPrefetch).toBeDefined()
    })
  })

  describe('when the prefetch URLs match', () => {
    let result: ReturnType<typeof consumeWhatsOnPrefetch>
    let eventsPromise: Promise<null>
    let scenesPromise: Promise<null>

    beforeEach(() => {
      eventsPromise = Promise.resolve(null)
      scenesPromise = Promise.resolve(null)
      window.__dclWhatsOnPrefetch = {
        eventsUrl: EVENTS_URL,
        scenesUrl: SCENES_URL,
        events: eventsPromise,
        scenes: scenesPromise
      }
      result = consumeWhatsOnPrefetch(EVENTS_URL, SCENES_URL)
    })

    it('should return the prefetched promises', () => {
      expect(result).not.toBeNull()
      expect(result?.events).toBe(eventsPromise)
      expect(result?.scenes).toBe(scenesPromise)
    })

    it('should clear the prefetch from the window so subsequent calls return null', () => {
      expect(window.__dclWhatsOnPrefetch).toBeUndefined()
      expect(consumeWhatsOnPrefetch(EVENTS_URL, SCENES_URL)).toBeNull()
    })
  })
})

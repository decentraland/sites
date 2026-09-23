import { ensureSegmentAnonymousId, generateUuid } from './segmentAnonymousId'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('when using Segment anonymous ids', () => {
  afterEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
  })

  describe('when generating an id', () => {
    it('should return a UUID-shaped string', () => {
      expect(generateUuid()).toMatch(UUID_RE)
    })
  })

  describe('when an existing raw id is present', () => {
    it('should return the stored id', () => {
      localStorage.setItem('ajs_anonymous_id', '11111111-1111-4111-8111-111111111111')

      expect(ensureSegmentAnonymousId()).toBe('11111111-1111-4111-8111-111111111111')
    })
  })

  describe('when an existing JSON-encoded id is present', () => {
    it('should return the decoded id', () => {
      localStorage.setItem('ajs_anonymous_id', '"22222222-2222-4222-8222-222222222222"')

      expect(ensureSegmentAnonymousId()).toBe('22222222-2222-4222-8222-222222222222')
    })
  })

  describe('when no id is present', () => {
    it('should mint and persist a JSON-encoded id', () => {
      const id = ensureSegmentAnonymousId()

      expect(id).toMatch(UUID_RE)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(id))
    })
  })

  describe('when a malformed id is present', () => {
    it('should replace it with a fresh JSON-encoded id', () => {
      localStorage.setItem('ajs_anonymous_id', 'not-a-uuid')

      const id = ensureSegmentAnonymousId()

      expect(id).toMatch(UUID_RE)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(id))
    })
  })

  describe('when crypto.randomUUID is available', () => {
    it('should delegate to it', () => {
      const minted = '33333333-3333-4333-8333-333333333333'
      const cryptoObj = globalThis.crypto as Crypto & { randomUUID?: () => string }
      const original = cryptoObj.randomUUID
      Object.defineProperty(cryptoObj, 'randomUUID', { value: () => minted, configurable: true })

      try {
        expect(generateUuid()).toBe(minted)
      } finally {
        Object.defineProperty(cryptoObj, 'randomUUID', { value: original, configurable: true })
      }
    })
  })

  describe('when localStorage throws', () => {
    it('should return a throwaway id without persisting', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage blocked')
      })

      expect(ensureSegmentAnonymousId()).toMatch(UUID_RE)
    })
  })
})

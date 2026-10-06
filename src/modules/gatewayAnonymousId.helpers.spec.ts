import { createGatewayAnonymousIdResolver } from './gatewayAnonymousId.helpers'

const UUID = '11111111-1111-4111-8111-111111111111'
const KEY = 'dcl_gateway_anon_user_id'

describe('when resolving gateway attribution', () => {
  let resolve: ReturnType<typeof createGatewayAnonymousIdResolver>

  beforeEach(() => {
    localStorage.clear()
    resolve = createGatewayAnonymousIdResolver()
  })
  afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
  })

  describe('and Segment already has a gateway-compatible UUID', () => {
    it('should preserve the UUID without writing a separate mapping', () => {
      expect(resolve(UUID)).toBe(UUID)
      expect(localStorage.getItem(KEY)).toBeNull()
    })
  })

  describe('and Segment has a custom identity', () => {
    let attributionId: string
    beforeEach(() => {
      localStorage.setItem('ajs_anonymous_id', JSON.stringify('custom-id'))
      attributionId = resolve('custom-id')
    })
    it('should reuse the same UUID for retries', () => {
      expect(resolve('custom-id')).toBe(attributionId)
      expect(attributionId).toMatch(/^[0-9a-f-]{36}$/)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify('custom-id'))
    })
    it('should reuse the persisted mapping after a page reload', () => {
      expect(createGatewayAnonymousIdResolver()('custom-id')).toBe(attributionId)
    })
    it('should use a new attribution UUID when Segment identity changes', () => {
      expect(resolve('another-id')).not.toBe(attributionId)
    })
  })

  describe.each([
    'malformed',
    'null',
    '123',
    '{}',
    JSON.stringify({ segmentId: 'other-id', attributionId: UUID }),
    JSON.stringify({ segmentId: 'custom-id' }),
    JSON.stringify({ segmentId: 'custom-id', attributionId: 123 }),
    JSON.stringify({ segmentId: 'custom-id', attributionId: 'not-a-uuid' })
  ])('and the stored mapping is unusable: %s', raw => {
    beforeEach(() => localStorage.setItem(KEY, raw))
    it('should replace it with stable gateway-compatible attribution', () => {
      expect(resolve('custom-id')).toMatch(/^[0-9a-f-]{36}$/)
      expect(resolve('custom-id')).toBe(createGatewayAnonymousIdResolver()('custom-id'))
    })
  })

  describe('and localStorage is blocked', () => {
    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
    })
    it('should keep retries stable and rotate across identity changes, including A to B to A', () => {
      const first = resolve('custom-id')
      expect(resolve('custom-id')).toBe(first)
      const second = resolve('other-id')
      expect(second).not.toBe(first)
      expect(resolve('other-id')).toBe(second)
      const returned = resolve('custom-id')
      expect(returned).not.toBe(first)
      expect(returned).not.toBe(second)
      expect(resolve('custom-id')).toBe(returned)
    })
  })
})

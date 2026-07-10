import { resolveSegmentUserId } from './segmentUserId'

describe('when resolving the Segment user id', () => {
  afterEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
  })

  describe('when a JSON-encoded id is present', () => {
    it('should return the decoded wallet address', () => {
      localStorage.setItem('ajs_user_id', '"0x1234567890123456789012345678901234567890"')

      expect(resolveSegmentUserId()).toBe('0x1234567890123456789012345678901234567890')
    })
  })

  describe('when a raw (un-encoded) id is present', () => {
    it('should return it verbatim', () => {
      localStorage.setItem('ajs_user_id', '0xabc')

      expect(resolveSegmentUserId()).toBe('0xabc')
    })
  })

  describe('when no id is present', () => {
    it('should return undefined so the beacon ships anonymously', () => {
      expect(resolveSegmentUserId()).toBeUndefined()
    })
  })

  describe('when the stored id is an empty JSON string', () => {
    it('should return undefined', () => {
      localStorage.setItem('ajs_user_id', '""')

      expect(resolveSegmentUserId()).toBeUndefined()
    })
  })

  describe('when the stored id decodes to a non-string', () => {
    it('should return undefined', () => {
      localStorage.setItem('ajs_user_id', 'null')

      expect(resolveSegmentUserId()).toBeUndefined()
    })
  })

  describe('when localStorage throws', () => {
    it('should return undefined without propagating', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage blocked')
      })

      expect(resolveSegmentUserId()).toBeUndefined()
    })
  })
})

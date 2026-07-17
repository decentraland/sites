import { isEns } from './ens'

describe('isEns', () => {
  describe('when the value ends with .eth', () => {
    it('should return true', () => {
      expect(isEns('decentraland.eth')).toBe(true)
    })
  })

  describe('when the value has dots and alphanumerics ending in .eth', () => {
    it('should return true for sub.realm.eth', () => {
      expect(isEns('sub.realm.eth')).toBe(true)
    })
  })

  describe('when the value contains hyphens or underscores (valid ENS labels)', () => {
    it('should return true for hyphenated and underscored world names', () => {
      expect(isEns('my-world.dcl.eth')).toBe(true)
      expect(isEns('common-ground.dcl.eth')).toBe(true)
      expect(isEns('foo_bar.eth')).toBe(true)
    })
  })

  describe('when the value does not end with .eth', () => {
    it('should return false', () => {
      expect(isEns('decentraland.org')).toBe(false)
    })

    it('should return false for a bare coordinate', () => {
      expect(isEns('0,0')).toBe(false)
    })
  })

  describe('when the value is undefined', () => {
    it('should return false', () => {
      expect(isEns(undefined)).toBe(false)
    })
  })
})

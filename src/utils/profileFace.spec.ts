import { getProfileFaceUrl } from './profileFace'

describe('getProfileFaceUrl', () => {
  describe('when the address is already lowercase', () => {
    it('should build the profile-images URL from the address', () => {
      expect(getProfileFaceUrl('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(
        'https://profile-images.decentraland.org/entities/0xabcdef1234567890abcdef1234567890abcdef12/face.png'
      )
    })
  })

  describe('when the address contains uppercase characters', () => {
    it('should normalize the address to lowercase so the same profile is not fetched twice', () => {
      expect(getProfileFaceUrl('0xABCDEF1234567890abcdef1234567890ABCDEF12')).toBe(
        'https://profile-images.decentraland.org/entities/0xabcdef1234567890abcdef1234567890abcdef12/face.png'
      )
    })
  })

  describe('when the address is not a valid 0x + 40-hex address', () => {
    it('should return undefined for inputs with path separators to block traversal attempts', () => {
      expect(getProfileFaceUrl('0xabc/../../admin')).toBeUndefined()
    })

    it('should return undefined for non-hex characters', () => {
      expect(getProfileFaceUrl('0xZZZZdef1234567890abcdef1234567890abcdef12')).toBeUndefined()
    })

    it('should return undefined for addresses of the wrong length', () => {
      expect(getProfileFaceUrl('0xabc')).toBeUndefined()
      expect(getProfileFaceUrl('0xabcdef1234567890abcdef1234567890abcdef1200')).toBeUndefined()
    })

    it('should return undefined for the empty string', () => {
      expect(getProfileFaceUrl('')).toBeUndefined()
    })
  })
})

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
})

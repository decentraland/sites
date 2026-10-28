import { truncateAddress } from './address'

describe('truncateAddress', () => {
  describe('when the value is a full address', () => {
    it('should keep the first 6 and last 4 characters around an ellipsis', () => {
      expect(truncateAddress('0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd')).toBe('0xd9b9…0ddd')
    })
  })

  describe('when the value is shorter than the truncation window', () => {
    it('should return it untouched', () => {
      expect(truncateAddress('0x1234a')).toBe('0x1234a')
    })
  })
})

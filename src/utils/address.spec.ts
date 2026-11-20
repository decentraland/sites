import { truncateAddress } from './address'

describe('truncateAddress', () => {
  describe('when the value is a full address', () => {
    it('should keep the first 6 and last 4 characters around an ellipsis', () => {
      expect(truncateAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe('0xabcd…abcd')
    })
  })

  describe('when the value is shorter than the truncation window', () => {
    it('should return it untouched', () => {
      expect(truncateAddress('0x1234a')).toBe('0x1234a')
    })
  })
})

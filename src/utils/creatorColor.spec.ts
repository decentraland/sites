import { getCreatorColor } from './creatorColor'

const NEUTRAL_FALLBACK = '#262626'

describe('getCreatorColor', () => {
  describe('when no address is provided', () => {
    it('should return the neutral fallback for undefined', () => {
      expect(getCreatorColor(undefined)).toBe(NEUTRAL_FALLBACK)
    })

    it('should return the neutral fallback for null', () => {
      expect(getCreatorColor(null)).toBe(NEUTRAL_FALLBACK)
    })

    it('should return the neutral fallback for an empty/whitespace address', () => {
      expect(getCreatorColor('')).toBe(NEUTRAL_FALLBACK)
      expect(getCreatorColor('   ')).toBe(NEUTRAL_FALLBACK)
    })
  })

  describe('when an address is provided', () => {
    it('should return the same color for the same address across calls', () => {
      const address = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      expect(getCreatorColor(address)).toBe(getCreatorColor(address))
    })

    it('should ignore casing when computing the color', () => {
      const lower = '0xabcdef0123456789abcdef0123456789abcdef01'
      const upper = lower.toUpperCase()
      expect(getCreatorColor(lower)).toBe(getCreatorColor(upper))
    })

    it('should produce different colors for sufficiently different addresses', () => {
      const a = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const b = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      expect(getCreatorColor(a)).not.toBe(getCreatorColor(b))
    })

    it('should return a well-formed hsl() string with the controlled saturation/lightness', () => {
      const color = getCreatorColor('0x1234567890abcdef1234567890abcdef12345678')
      expect(color).toMatch(/^hsl\(\d{1,3} 45% 40%\)$/)
    })
  })
})

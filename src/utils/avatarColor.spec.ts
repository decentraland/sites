import { fnv1a32, getAvatarBackgroundColor, getDisplayName, getValidatedName, hsvToRgb, rgbToHex } from './avatarColor'

const FNV_OFFSET_BASIS = 0x811c9dc5

describe('avatarColor', () => {
  describe('fnv1a32', () => {
    it('should return the FNV offset basis for an empty string', () => {
      expect(fnv1a32('')).toBe(FNV_OFFSET_BASIS)
    })

    it('should match the canonical FNV-1a 32-bit reference vectors', () => {
      // http://www.isthe.com/chongo/tech/comp/fnv/
      expect(fnv1a32('a').toString(16)).toBe('e40c292c')
      expect(fnv1a32('foobar').toString(16)).toBe('bf9cf968')
    })

    it('should produce well-spread hashes for similar strings', () => {
      const a = fnv1a32('Alice')
      const b = fnv1a32('Alicf')
      expect(a).not.toBe(b)
    })
  })

  describe('hsvToRgb', () => {
    it('should map hue=0 with saturation=0.75/value=1 to a soft red', () => {
      expect(hsvToRgb(0, 0.75, 1)).toEqual({ r: 1, g: 0.25, b: 0.25 })
    })

    it('should treat hue=1 as hue=0 (full wrap)', () => {
      expect(hsvToRgb(1, 0.75, 1)).toEqual(hsvToRgb(0, 0.75, 1))
    })

    it('should produce cyan-ish output for hue=0.5', () => {
      const { r, g, b } = hsvToRgb(0.5, 0.75, 1)
      expect(r).toBeCloseTo(0.25, 5)
      expect(g).toBeCloseTo(1, 5)
      expect(b).toBeCloseTo(1, 5)
    })
  })

  describe('rgbToHex', () => {
    it('should pad single-digit components with a leading zero', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
    })

    it('should clamp out-of-range components into [0, 255]', () => {
      expect(rgbToHex({ r: 1.5, g: -0.2, b: 1 })).toBe('#ff00ff')
    })
  })

  describe('getValidatedName', () => {
    it('should return an empty string when the input is missing', () => {
      expect(getValidatedName(undefined)).toBe('')
      expect(getValidatedName(null)).toBe('')
      expect(getValidatedName('')).toBe('')
    })

    it('should keep alphanumeric Unicode and strip punctuation/whitespace', () => {
      expect(getValidatedName('  Alice!  ')).toBe('Alice')
      expect(getValidatedName('Élise-42')).toBe('Élise42')
      expect(getValidatedName('李 四')).toBe('李四')
    })

    it('should drop unpaired surrogate halves (e.g. emoji glyphs)', () => {
      expect(getValidatedName('Bob😀')).toBe('Bob')
    })

    it('should drop astral-plane CJK extension characters so the result stays parity with C# IsLetterOrDigit per UTF-16 char', () => {
      // 𠮷 (U+20BB7) is a non-BMP letter; C#'s `char.IsLetterOrDigit` returns false for each
      // surrogate half, so it gets stripped. The TS port mirrors that — astral letters do NOT
      // survive validation. If a future PR "fixes" surrogate handling to accept astral letters
      // it will silently diverge from unity-explorer.
      expect(getValidatedName('Bob𠮷')).toBe('Bob')
    })
  })

  describe('getDisplayName', () => {
    it('should return the validated name when the user has a claimed name', () => {
      expect(getDisplayName({ name: 'Alice', hasClaimedName: true, ethAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdef1234' })).toBe(
        'Alice'
      )
    })

    it('should append #<last4> when the user has no claimed name', () => {
      expect(getDisplayName({ name: 'Alice', hasClaimedName: false, ethAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdef1234' })).toBe(
        'Alice#1234'
      )
    })

    it('should fall back to just the validated name when the address is too short', () => {
      expect(getDisplayName({ name: 'Alice', hasClaimedName: false, ethAddress: '0x12' })).toBe('Alice')
    })

    it('should return an empty string when the name has no alphanumeric characters', () => {
      expect(getDisplayName({ name: '!!!', hasClaimedName: false, ethAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdef1234' })).toBe('')
    })
  })

  describe('getAvatarBackgroundColor', () => {
    it('should return white when the display name is missing', () => {
      expect(getAvatarBackgroundColor(undefined)).toBe('#ffffff')
      expect(getAvatarBackgroundColor('')).toBe('#ffffff')
    })

    it('should match the unity-explorer NameColorHelper output for known display names', () => {
      // Generated locally with the algorithm verified against unity-explorer's
      // NameColorHelper.cs (FNV-1a 32-bit + Color.HSVToRGB(hue, 0.75, 1)).
      expect(getAvatarBackgroundColor('Alice')).toBe('#f5ff40')
      expect(getAvatarBackgroundColor('Alice#1234')).toBe('#ff4047')
      expect(getAvatarBackgroundColor('Bob#cdef')).toBe('#46ff40')
      expect(getAvatarBackgroundColor('李四')).toBe('#40a5ff')
    })

    it('should be deterministic for identical input', () => {
      expect(getAvatarBackgroundColor('Alice#1234')).toBe(getAvatarBackgroundColor('Alice#1234'))
    })

    it('should diverge when the wallet suffix changes for an unclaimed name', () => {
      const claimed = getDisplayName({ name: 'Alice', hasClaimedName: true, ethAddress: '0xabcd' })
      const unclaimedA = getDisplayName({ name: 'Alice', hasClaimedName: false, ethAddress: '0x...1234' })
      const unclaimedB = getDisplayName({ name: 'Alice', hasClaimedName: false, ethAddress: '0x...5678' })
      expect(getAvatarBackgroundColor(claimed)).not.toBe(getAvatarBackgroundColor(unclaimedA))
      expect(getAvatarBackgroundColor(unclaimedA)).not.toBe(getAvatarBackgroundColor(unclaimedB))
    })
  })
})

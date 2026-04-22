import { buildMinimalAvatar, formatEthAddress, isValidEthAddress } from './avatar'

describe('isValidEthAddress', () => {
  describe('when the input is a well-formed 0x + 40-hex address', () => {
    it('should accept lowercase', () => {
      expect(isValidEthAddress('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(true)
    })

    it('should accept mixed case', () => {
      expect(isValidEthAddress('0xABCDEF1234567890abcdef1234567890ABCDEF12')).toBe(true)
    })
  })

  describe('when the input is malformed', () => {
    it.each([
      ['empty string', ''],
      ['missing 0x prefix', 'abcdef1234567890abcdef1234567890abcdef12'],
      ['path traversal attempt', '0xabc/../admin'],
      ['non-hex chars', '0xZZZZdef1234567890abcdef1234567890abcdef12'],
      ['short', '0xabc'],
      ['long', '0xabcdef1234567890abcdef1234567890abcdef1200'],
      ['undefined', undefined],
      ['null', null]
    ])('should reject %s', (_label, value) => {
      expect(isValidEthAddress(value)).toBe(false)
    })
  })
})

describe('buildMinimalAvatar', () => {
  describe('when given a valid address', () => {
    it('should preserve name, ethAddress, and faceUrl in the Avatar structure', () => {
      const result = buildMinimalAvatar({
        name: 'Alice',
        ethAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        faceUrl: 'https://example.com/a.png'
      }) as unknown as {
        name: string
        ethAddress: string
        avatar: { snapshots: { face256: string; body: string } }
      }

      expect(result.name).toBe('Alice')
      expect(result.ethAddress).toBe('0xabcdef1234567890abcdef1234567890abcdef12')
      expect(result.avatar.snapshots.face256).toBe('https://example.com/a.png')
    })
  })

  describe('when given an invalid address', () => {
    it('should sanitize ethAddress to empty string so no malformed profile URL is built', () => {
      const result = buildMinimalAvatar({
        name: 'Attacker',
        ethAddress: '../admin'
      }) as unknown as { ethAddress: string }

      expect(result.ethAddress).toBe('')
    })
  })

  describe('when no faceUrl is provided', () => {
    it('should always include a snapshots stub so consumers can read face256 without a null-check', () => {
      const result = buildMinimalAvatar({ name: 'NoFace', ethAddress: '' }) as unknown as {
        avatar: { snapshots: { face256: string; body: string } }
      }

      expect(result.avatar.snapshots.face256).toBe('')
      expect(result.avatar.snapshots.body).toBe('')
    })
  })
})

describe('formatEthAddress', () => {
  describe('when given an Ethereum address', () => {
    it('should return the compact display form', () => {
      expect(formatEthAddress('0xabcdef1234567890abcdef1234567890abcdef12')).toBe('0xabcd…ef12')
    })
  })
})

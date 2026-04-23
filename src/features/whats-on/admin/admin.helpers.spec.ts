import { hasAnyAdminPermission, isValidWalletAddress } from './admin.helpers'
import { AdminPermission } from './admin.types'

describe('when checking if a user has admin permissions', () => {
  describe('and the permissions list is empty', () => {
    let permissions: AdminPermission[]

    beforeEach(() => {
      permissions = []
    })

    it('should return false', () => {
      expect(hasAnyAdminPermission(permissions)).toBe(false)
    })
  })

  describe('and the permissions list has at least one entry', () => {
    let permissions: AdminPermission[]

    beforeEach(() => {
      permissions = [AdminPermission.EDIT_ANY_PROFILE]
    })

    it('should return true', () => {
      expect(hasAnyAdminPermission(permissions)).toBe(true)
    })
  })

  describe('and the permissions value is undefined', () => {
    it('should return false', () => {
      expect(hasAnyAdminPermission(undefined)).toBe(false)
    })
  })
})

describe('when validating a wallet address', () => {
  describe('and the input is a canonical 0x-prefixed 40-hex address', () => {
    let address: string

    beforeEach(() => {
      address = '0x1234567890abcdef1234567890ABCDEF12345678'
    })

    it('should return true', () => {
      expect(isValidWalletAddress(address)).toBe(true)
    })
  })

  describe('and the input is shorter than 40 hex chars', () => {
    it('should return false', () => {
      expect(isValidWalletAddress('0x1234')).toBe(false)
    })
  })

  describe('and the input is missing the 0x prefix', () => {
    it('should return false', () => {
      expect(isValidWalletAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false)
    })
  })

  describe('and the input has leading and trailing whitespace', () => {
    it('should return true after trimming', () => {
      expect(isValidWalletAddress('   0x1234567890abcdef1234567890abcdef12345678   ')).toBe(true)
    })
  })
})

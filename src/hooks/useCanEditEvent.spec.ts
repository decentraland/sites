import { renderHook } from '@testing-library/react'
import { useCanEditEvent } from './useCanEditEvent'

jest.mock('./useAdminPermissions', () => ({
  useAdminPermissions: jest.fn()
}))

jest.mock('./useWalletAddress', () => ({
  useWalletAddress: jest.fn()
}))

const mockedAdminPermissions = jest.requireMock('./useAdminPermissions').useAdminPermissions as jest.Mock
const mockedWalletAddress = jest.requireMock('./useWalletAddress').useWalletAddress as jest.Mock

describe('useCanEditEvent', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the current wallet has canEditAnyEvent', () => {
    beforeEach(() => {
      mockedAdminPermissions.mockReturnValue({ canEditAnyEvent: true })
      mockedWalletAddress.mockReturnValue({ address: '0x0000000000000000000000000000000000000001' })
    })

    it('should return true regardless of creator address', () => {
      const { result } = renderHook(() => useCanEditEvent('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'))
      expect(result.current).toBe(true)
    })
  })

  describe('when the current wallet is the event creator', () => {
    beforeEach(() => {
      mockedAdminPermissions.mockReturnValue({ canEditAnyEvent: false })
      mockedWalletAddress.mockReturnValue({ address: '0xAbCdEf0123456789ABcdef0123456789abCDEF01' })
    })

    it('should return true when the creator address matches case-insensitively', () => {
      const { result } = renderHook(() => useCanEditEvent('0xabcdef0123456789abcdef0123456789abcdef01'))
      expect(result.current).toBe(true)
    })
  })

  describe('when the current wallet is neither the creator nor an admin', () => {
    beforeEach(() => {
      mockedAdminPermissions.mockReturnValue({ canEditAnyEvent: false })
      mockedWalletAddress.mockReturnValue({ address: '0x0000000000000000000000000000000000000001' })
    })

    it('should return false', () => {
      const { result } = renderHook(() => useCanEditEvent('0x0000000000000000000000000000000000000002'))
      expect(result.current).toBe(false)
    })
  })

  describe('when there is no wallet connected', () => {
    beforeEach(() => {
      mockedAdminPermissions.mockReturnValue({ canEditAnyEvent: false })
      mockedWalletAddress.mockReturnValue({ address: undefined })
    })

    it('should return false', () => {
      const { result } = renderHook(() => useCanEditEvent('0x0000000000000000000000000000000000000002'))
      expect(result.current).toBe(false)
    })
  })

  describe('when the creator address is missing', () => {
    beforeEach(() => {
      mockedAdminPermissions.mockReturnValue({ canEditAnyEvent: false })
      mockedWalletAddress.mockReturnValue({ address: '0x0000000000000000000000000000000000000001' })
    })

    it('should return false', () => {
      const { result } = renderHook(() => useCanEditEvent(null))
      expect(result.current).toBe(false)
    })
  })
})

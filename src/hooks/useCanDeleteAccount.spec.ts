import { renderHook } from '@testing-library/react'
import { useCanDeleteAccount } from './useCanDeleteAccount'
import { useIsThirdwebAccount } from './useIsThirdwebAccount'
import { useMagicAccountStatus } from './useMagicAccountStatus'

jest.mock('./useIsThirdwebAccount', () => ({
  useIsThirdwebAccount: jest.fn()
}))

jest.mock('./useMagicAccountStatus', () => ({
  useMagicAccountStatus: jest.fn()
}))

const mockUseIsThirdwebAccount = useIsThirdwebAccount as jest.MockedFunction<typeof useIsThirdwebAccount>
const mockUseMagicAccountStatus = useMagicAccountStatus as jest.MockedFunction<typeof useMagicAccountStatus>

describe('useCanDeleteAccount', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the account is a thirdweb login', () => {
    beforeEach(() => {
      mockUseIsThirdwebAccount.mockReturnValue(true)
      mockUseMagicAccountStatus.mockReturnValue({ isMagic: false, isLoading: false })
    })

    it('should allow deletion as a non-Magic account', () => {
      const { result } = renderHook(() => useCanDeleteAccount())

      expect(result.current).toEqual({ canDelete: true, isMagic: false, isResolvingProvider: false })
    })

    it('should skip the Magic SDK check', () => {
      renderHook(() => useCanDeleteAccount())

      expect(mockUseMagicAccountStatus).toHaveBeenCalledWith({ skip: true })
    })
  })

  describe('when the account is a Magic login', () => {
    beforeEach(() => {
      mockUseIsThirdwebAccount.mockReturnValue(false)
      mockUseMagicAccountStatus.mockReturnValue({ isMagic: true, isLoading: false })
    })

    it('should allow deletion and flag the account as Magic', () => {
      const { result } = renderHook(() => useCanDeleteAccount())

      expect(result.current).toEqual({ canDelete: true, isMagic: true, isResolvingProvider: false })
    })
  })

  describe('when the Magic provider check is still resolving', () => {
    beforeEach(() => {
      mockUseIsThirdwebAccount.mockReturnValue(false)
      mockUseMagicAccountStatus.mockReturnValue({ isMagic: false, isLoading: true })
    })

    it('should not allow deletion yet and flag the provider as resolving', () => {
      const { result } = renderHook(() => useCanDeleteAccount())

      expect(result.current).toEqual({ canDelete: false, isMagic: false, isResolvingProvider: true })
    })
  })

  describe('when the account is self-custodial', () => {
    beforeEach(() => {
      mockUseIsThirdwebAccount.mockReturnValue(false)
      mockUseMagicAccountStatus.mockReturnValue({ isMagic: false, isLoading: false })
    })

    it('should not allow deletion', () => {
      const { result } = renderHook(() => useCanDeleteAccount())

      expect(result.current).toEqual({ canDelete: false, isMagic: false, isResolvingProvider: false })
    })
  })
})

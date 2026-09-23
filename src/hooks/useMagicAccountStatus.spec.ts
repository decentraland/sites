import { renderHook, waitFor } from '@testing-library/react'
import { isMagicLoggedIn } from '../lib/magic'
import { useMagicAccountStatus } from './useMagicAccountStatus'

jest.mock('../lib/magic', () => ({
  isMagicLoggedIn: jest.fn()
}))

const mockIsMagicLoggedIn = isMagicLoggedIn as jest.MockedFunction<typeof isMagicLoggedIn>

describe('useMagicAccountStatus', () => {
  beforeEach(() => {
    mockIsMagicLoggedIn.mockResolvedValue(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when there is an active Magic session', () => {
    beforeEach(() => {
      mockIsMagicLoggedIn.mockResolvedValue(true)
    })

    it('should report loading until the SDK check resolves, then a Magic account', async () => {
      const { result } = renderHook(() => useMagicAccountStatus())

      expect(result.current).toEqual({ isMagic: false, isLoading: true })
      await waitFor(() => expect(result.current).toEqual({ isMagic: true, isLoading: false }))
    })
  })

  describe('when there is no active Magic session', () => {
    it('should resolve to a settled non-Magic account', async () => {
      const { result } = renderHook(() => useMagicAccountStatus())

      await waitFor(() => expect(result.current).toEqual({ isMagic: false, isLoading: false }))
    })
  })

  describe('when skip is set', () => {
    it('should report a settled non-Magic account without querying the Magic SDK', () => {
      const { result } = renderHook(() => useMagicAccountStatus({ skip: true }))

      expect(result.current).toEqual({ isMagic: false, isLoading: false })
      expect(mockIsMagicLoggedIn).not.toHaveBeenCalled()
    })
  })
})

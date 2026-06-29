import { renderHook, waitFor } from '@testing-library/react'
import { isMagicLoggedIn } from '../lib/magic'
import { useIsMagicAccount } from './useIsMagicAccount'

jest.mock('../lib/magic', () => ({
  isMagicLoggedIn: jest.fn()
}))

const mockIsMagicLoggedIn = isMagicLoggedIn as jest.MockedFunction<typeof isMagicLoggedIn>

describe('useIsMagicAccount', () => {
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

    it('should be undefined until the SDK check resolves, then resolve to true', async () => {
      const { result } = renderHook(() => useIsMagicAccount())

      expect(result.current).toBeUndefined()
      await waitFor(() => expect(result.current).toBe(true))
    })
  })

  describe('when there is no active Magic session', () => {
    it('should resolve to false', async () => {
      const { result } = renderHook(() => useIsMagicAccount())

      await waitFor(() => expect(result.current).toBe(false))
    })
  })

  describe('when skip is set', () => {
    it('should be false and never query the Magic SDK', () => {
      const { result } = renderHook(() => useIsMagicAccount({ skip: true }))

      expect(result.current).toBe(false)
      expect(mockIsMagicLoggedIn).not.toHaveBeenCalled()
    })
  })
})

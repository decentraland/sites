import { renderHook, waitFor } from '@testing-library/react'
import { isMagicLoggedIn } from '../lib/magic'
import { useIsMagicAccount } from './useIsMagicAccount'

jest.mock('../lib/magic', () => ({
  isMagicLoggedIn: jest.fn()
}))

const mockIsMagicLoggedIn = isMagicLoggedIn as jest.MockedFunction<typeof isMagicLoggedIn>

const setRecentConnector = (id: string) => window.localStorage.setItem('wagmi.recentConnectorId', JSON.stringify(id))

describe('useIsMagicAccount', () => {
  beforeEach(() => {
    mockIsMagicLoggedIn.mockResolvedValue(false)
  })

  afterEach(() => {
    window.localStorage.clear()
    jest.clearAllMocks()
  })

  describe('when a Magic user email is stored', () => {
    beforeEach(() => {
      window.localStorage.setItem('dcl_magic_user_email', 'jane.doe@example.com')
    })

    it('should be true synchronously without querying the Magic SDK', () => {
      const { result } = renderHook(() => useIsMagicAccount())

      expect(result.current).toBe(true)
      expect(mockIsMagicLoggedIn).not.toHaveBeenCalled()
    })
  })

  describe('when no Magic email is stored', () => {
    describe('and the most recent wagmi connector is Magic', () => {
      beforeEach(() => {
        setRecentConnector('magic')
      })

      it('should be true synchronously without querying the Magic SDK', () => {
        const { result } = renderHook(() => useIsMagicAccount())

        expect(result.current).toBe(true)
        expect(mockIsMagicLoggedIn).not.toHaveBeenCalled()
      })
    })

    describe('and the most recent wagmi connector is a non-Magic wallet', () => {
      beforeEach(() => {
        setRecentConnector('injected')
      })

      it('should be false synchronously without querying the Magic SDK', () => {
        const { result } = renderHook(() => useIsMagicAccount())

        expect(result.current).toBe(false)
        expect(mockIsMagicLoggedIn).not.toHaveBeenCalled()
      })
    })

    describe('and there is no recent wagmi connector', () => {
      describe('and there is an active Magic session', () => {
        beforeEach(() => {
          mockIsMagicLoggedIn.mockResolvedValue(true)
        })

        it('should be undefined until the SDK check resolves, then resolve to true (covering email-less logins)', async () => {
          const { result } = renderHook(() => useIsMagicAccount())

          expect(result.current).toBeUndefined()
          await waitFor(() => expect(result.current).toBe(true))
        })
      })

      describe('and there is no active Magic session', () => {
        it('should resolve to false (self-custodial login)', async () => {
          const { result } = renderHook(() => useIsMagicAccount())

          await waitFor(() => expect(result.current).toBe(false))
        })
      })
    })
  })

  describe('when skip is set', () => {
    beforeEach(() => {
      window.localStorage.setItem('dcl_magic_user_email', 'jane.doe@example.com')
    })

    it('should be false and never query the Magic SDK even if a Magic email is present', () => {
      const { result } = renderHook(() => useIsMagicAccount({ skip: true }))

      expect(result.current).toBe(false)
      expect(mockIsMagicLoggedIn).not.toHaveBeenCalled()
    })
  })
})

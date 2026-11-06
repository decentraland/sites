import { renderHook } from '@testing-library/react'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { useMagicAccountStatus } from '../../../hooks/useMagicAccountStatus'
import { useMagicSigner } from './useMagicSigner'

jest.mock('../../../hooks/useIsThirdwebAccount', () => ({ useIsThirdwebAccount: jest.fn() }))
jest.mock('../../../hooks/useMagicAccountStatus', () => ({ useMagicAccountStatus: jest.fn() }))

const mockConnect = jest.fn()
const magicConnector = { id: 'magic', name: 'Magic' }
const walletConnectConnector = { id: 'walletConnect', name: 'WalletConnect' }
let mockAccount: { connector: { id: string } | undefined; status: string }
let mockConnectors: Array<{ id: string; name: string }>

jest.mock('wagmi', () => ({
  useAccount: () => mockAccount,
  useConnect: () => ({ connect: mockConnect, connectors: mockConnectors })
}))

const mockUseIsThirdwebAccount = useIsThirdwebAccount as jest.MockedFunction<typeof useIsThirdwebAccount>
const mockUseMagicAccountStatus = useMagicAccountStatus as jest.MockedFunction<typeof useMagicAccountStatus>

describe('useMagicSigner', () => {
  beforeEach(() => {
    mockUseIsThirdwebAccount.mockReturnValue(false)
    mockUseMagicAccountStatus.mockReturnValue({ isMagic: false, isLoading: false })
    mockAccount = { connector: undefined, status: 'disconnected' }
    mockConnectors = [walletConnectConnector, magicConnector]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('while the Magic session check is resolving', () => {
    beforeEach(() => {
      mockUseMagicAccountStatus.mockReturnValue({ isMagic: false, isLoading: true })
    })

    it('should report connecting without connecting anything', () => {
      const { result } = renderHook(() => useMagicSigner())

      expect(result.current).toBe('connecting')
      expect(mockConnect).not.toHaveBeenCalled()
    })
  })

  describe('when the user did not sign in with Magic', () => {
    beforeEach(() => {
      mockAccount = { connector: walletConnectConnector, status: 'connected' }
    })

    it('should be ready and leave the connected wallet alone', () => {
      const { result } = renderHook(() => useMagicSigner())

      expect(result.current).toBe('ready')
      expect(mockConnect).not.toHaveBeenCalled()
    })
  })

  describe('when the user signed in with thirdweb', () => {
    beforeEach(() => {
      mockUseIsThirdwebAccount.mockReturnValue(true)
    })

    it('should skip the Magic session check', () => {
      renderHook(() => useMagicSigner())

      expect(mockUseMagicAccountStatus).toHaveBeenCalledWith({ skip: true })
    })
  })

  describe('when the user signed in with Magic', () => {
    beforeEach(() => {
      mockUseMagicAccountStatus.mockReturnValue({ isMagic: true, isLoading: false })
    })

    describe('and Magic is already the connected wallet', () => {
      beforeEach(() => {
        mockAccount = { connector: magicConnector, status: 'connected' }
      })

      it('should be ready', () => {
        const { result } = renderHook(() => useMagicSigner())

        expect(result.current).toBe('ready')
        expect(mockConnect).not.toHaveBeenCalled()
      })
    })

    describe('and an external wallet is connected instead', () => {
      beforeEach(() => {
        mockAccount = { connector: walletConnectConnector, status: 'connected' }
      })

      it('should connect Magic and report connecting meanwhile', () => {
        const { result } = renderHook(() => useMagicSigner())

        expect(result.current).toBe('connecting')
        expect(mockConnect).toHaveBeenCalledWith({ connector: magicConnector }, expect.any(Object))
      })
    })

    describe('and no wallet is connected', () => {
      it('should connect Magic', () => {
        renderHook(() => useMagicSigner())

        expect(mockConnect).toHaveBeenCalledWith({ connector: magicConnector }, expect.any(Object))
      })
    })

    describe('and wagmi is still reconnecting', () => {
      beforeEach(() => {
        mockAccount = { connector: undefined, status: 'reconnecting' }
      })

      it('should wait for the reconnect instead of connecting', () => {
        const { result } = renderHook(() => useMagicSigner())

        expect(result.current).toBe('connecting')
        expect(mockConnect).not.toHaveBeenCalled()
      })
    })

    describe('and connecting Magic fails', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        mockConnect.mockImplementation((_params, options: { onError: (error: Error) => void }) =>
          options.onError(new Error('Magic: User is not logged in'))
        )
      })

      it('should report failed and not retry', () => {
        const { result } = renderHook(() => useMagicSigner())

        expect(result.current).toBe('failed')
        expect(mockConnect).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the Magic connector is not configured', () => {
      beforeEach(() => {
        mockConnectors = [walletConnectConnector]
      })

      it('should report failed', () => {
        const { result } = renderHook(() => useMagicSigner())

        expect(result.current).toBe('failed')
      })
    })
  })
})

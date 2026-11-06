import { act, renderHook, waitFor } from '@testing-library/react'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { getMagicAddress } from '../../../lib/magic'
import { useMagicSigner } from './useMagicSigner'

jest.mock('../../../hooks/useIsThirdwebAccount', () => ({ useIsThirdwebAccount: jest.fn() }))
jest.mock('../../../lib/magic', () => ({ getMagicAddress: jest.fn() }))

const mockConnect = jest.fn()
const mockSwitchChain = jest.fn()
let mockIsSwitching: boolean
const magicConnector = { id: 'magic', name: 'Magic' }
const walletConnectConnector = { id: 'walletConnect', name: 'WalletConnect' }
const metaMaskConnector = { id: 'injected', name: 'MetaMask' }
let mockAccount: { address: string | undefined; chainId?: number; connector: { id: string } | undefined; status: string }
let mockConnectors: Array<{ id: string; name: string }>

jest.mock('wagmi', () => ({
  useAccount: () => mockAccount,
  useConnect: () => ({ connect: mockConnect, connectors: mockConnectors }),
  useSwitchChain: () => ({ switchChain: mockSwitchChain, isPending: mockIsSwitching })
}))

const mockUseIsThirdwebAccount = useIsThirdwebAccount as jest.MockedFunction<typeof useIsThirdwebAccount>
const mockGetMagicAddress = getMagicAddress as jest.MockedFunction<typeof getMagicAddress>

const SIGNED_IN = '0xD2DD000000000000000000000000000000000001'
const OTHER = '0x91E2000000000000000000000000000000000002'
const TARGET_CHAIN = 11155111
const OTHER_CHAIN = 1

describe('useMagicSigner', () => {
  beforeEach(() => {
    mockUseIsThirdwebAccount.mockReturnValue(false)
    mockGetMagicAddress.mockResolvedValue(null)
    mockAccount = { address: undefined, connector: undefined, status: 'disconnected' }
    mockConnectors = [walletConnectConnector, metaMaskConnector, magicConnector]
    mockIsSwitching = false
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet already connected is the signed-in account', () => {
    beforeEach(() => {
      mockAccount = { address: SIGNED_IN.toLowerCase(), connector: metaMaskConnector, status: 'connected' }
    })

    it('should be ready without looking up Magic', () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockGetMagicAddress).not.toHaveBeenCalled()
    })

    it('should leave a network switch to the user', () => {
      mockAccount = { ...mockAccount, chainId: OTHER_CHAIN }
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockSwitchChain).not.toHaveBeenCalled()
    })
  })

  describe('when the signed-in Magic wallet is connected on another network', () => {
    beforeEach(() => {
      mockAccount = { address: SIGNED_IN.toLowerCase(), chainId: OTHER_CHAIN, connector: magicConnector, status: 'connected' }
    })

    it('should switch it to the target network without asking the user', () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('connecting')
      expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: TARGET_CHAIN }, expect.any(Object))
    })

    it('should report failed when the switch fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockSwitchChain.mockImplementation((_params, options: { onError: (error: Error) => void }) => options.onError(new Error('boom')))
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      await waitFor(() => expect(result.current.state).toBe('failed'))
    })
  })

  describe('when the signed-in Magic wallet is connected on the target network', () => {
    beforeEach(() => {
      mockAccount = { address: SIGNED_IN.toLowerCase(), chainId: TARGET_CHAIN, connector: magicConnector, status: 'connected' }
    })

    it('should be ready', () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockSwitchChain).not.toHaveBeenCalled()
    })
  })

  describe('when there is no signed-in account', () => {
    it('should be ready without looking up Magic', () => {
      const { result } = renderHook(() => useMagicSigner(undefined, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockGetMagicAddress).not.toHaveBeenCalled()
    })
  })

  describe('when the user signed in with thirdweb', () => {
    beforeEach(() => {
      mockUseIsThirdwebAccount.mockReturnValue(true)
    })

    it('should be ready without looking up Magic', () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockGetMagicAddress).not.toHaveBeenCalled()
    })
  })

  describe('while wagmi is still reconnecting', () => {
    beforeEach(() => {
      mockAccount = { address: undefined, connector: undefined, status: 'reconnecting' }
    })

    it('should report checking and wait before looking up Magic', () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('checking')
      expect(mockGetMagicAddress).not.toHaveBeenCalled()
    })
  })

  describe('when a Magic session exists for a different account than the signed-in one', () => {
    beforeEach(() => {
      mockGetMagicAddress.mockResolvedValue(OTHER)
      mockAccount = { address: undefined, connector: undefined, status: 'disconnected' }
    })

    it('should leave the wallet choice to the user and never connect Magic', async () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('checking')
      await waitFor(() => expect(result.current.state).toBe('ready'))
      expect(mockConnect).not.toHaveBeenCalled()
    })
  })

  describe('when the signed-in account is the Magic account', () => {
    beforeEach(() => {
      mockGetMagicAddress.mockResolvedValue(SIGNED_IN.toLowerCase())
    })

    describe('and an external wallet with another account is connected', () => {
      beforeEach(() => {
        mockAccount = { address: OTHER, connector: walletConnectConnector, status: 'connected' }
      })

      it('should connect Magic and report connecting meanwhile', async () => {
        const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

        await waitFor(() =>
          expect(mockConnect).toHaveBeenCalledWith({ connector: magicConnector, chainId: TARGET_CHAIN }, expect.any(Object))
        )
        expect(result.current.state).toBe('connecting')
      })
    })

    describe('and no wallet is connected', () => {
      it('should connect Magic', async () => {
        renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

        await waitFor(() =>
          expect(mockConnect).toHaveBeenCalledWith({ connector: magicConnector, chainId: TARGET_CHAIN }, expect.any(Object))
        )
      })
    })

    describe('and connecting Magic fails', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        mockConnect.mockImplementation((_params, options: { onError: (error: Error) => void }) =>
          options.onError(new Error('Magic: User is not logged in'))
        )
      })

      it('should report failed without retrying on its own', async () => {
        const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

        await waitFor(() => expect(result.current.state).toBe('failed'))
        expect(mockConnect).toHaveBeenCalledTimes(1)
      })

      it('should connect Magic again when the user retries', async () => {
        const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
        await waitFor(() => expect(result.current.state).toBe('failed'))

        act(() => result.current.retry())

        await waitFor(() => expect(mockConnect).toHaveBeenCalledTimes(2))
      })
    })

    describe('and the Magic connector is not configured', () => {
      beforeEach(() => {
        mockConnectors = [walletConnectConnector]
      })

      it('should report failed', async () => {
        const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

        await waitFor(() => expect(result.current.state).toBe('failed'))
      })
    })
  })
})

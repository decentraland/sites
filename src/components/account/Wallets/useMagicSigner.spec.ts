import { act, renderHook, waitFor } from '@testing-library/react'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { getMagicAddress } from '../../../lib/magic'
import { useMagicSigner } from './useMagicSigner'

jest.mock('../../../hooks/useIsThirdwebAccount', () => ({ useIsThirdwebAccount: jest.fn() }))
jest.mock('../../../lib/magic', () => ({ getMagicAddress: jest.fn() }))

type Account = { address: string | undefined; chainId?: number; connector: { id: string } | undefined; status: string }

const mockConnectAsync = jest.fn()
const mockSwitchChainAsync = jest.fn()
const mockDisconnect = jest.fn()
const magicConnector = { id: 'magic', name: 'Magic' }
const walletConnectConnector = { id: 'walletConnect', name: 'WalletConnect' }
const metaMaskConnector = { id: 'injected', name: 'MetaMask' }
let mockAccount: Account
let mockConnectors: Array<{ id: string; name: string }>
let mockConnections: Array<{ accounts: string[]; connector: { id: string } }>

jest.mock('wagmi', () => ({
  useAccount: () => ({ ...mockAccount, isConnected: mockAccount.status === 'connected' }),
  useConnections: () => mockConnections,
  useConnect: () => ({ connectAsync: mockConnectAsync, connectors: mockConnectors }),
  useSwitchChain: () => ({ switchChainAsync: mockSwitchChainAsync }),
  useDisconnect: () => ({ disconnect: mockDisconnect })
}))

const mockUseIsThirdwebAccount = useIsThirdwebAccount as jest.MockedFunction<typeof useIsThirdwebAccount>
const mockGetMagicAddress = getMagicAddress as jest.MockedFunction<typeof getMagicAddress>

const SIGNED_IN = '0xD2DD000000000000000000000000000000000001'
const OTHER = '0x91E2000000000000000000000000000000000002'
const TARGET_CHAIN = 11155111
const OTHER_CHAIN = 1

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useMagicSigner', () => {
  beforeEach(() => {
    mockUseIsThirdwebAccount.mockReturnValue(false)
    mockGetMagicAddress.mockResolvedValue(null)
    mockConnectAsync.mockReset().mockResolvedValue({})
    mockSwitchChainAsync.mockReset().mockResolvedValue({})
    mockAccount = { address: undefined, connector: undefined, status: 'disconnected' }
    mockConnectors = [walletConnectConnector, metaMaskConnector, magicConnector]
    mockConnections = []
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  describe('when the wallet already connected is the signed-in account', () => {
    beforeEach(() => {
      mockAccount = { address: SIGNED_IN.toLowerCase(), chainId: OTHER_CHAIN, connector: metaMaskConnector, status: 'connected' }
    })

    it('should be ready without looking up Magic or switching networks', () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockGetMagicAddress).not.toHaveBeenCalled()
      expect(mockSwitchChainAsync).not.toHaveBeenCalled()
    })
  })

  describe('when there is no signed-in account', () => {
    it('should be ready without looking up Magic', () => {
      const { result } = renderHook(() => useMagicSigner(undefined, TARGET_CHAIN))

      expect(result.current.state).toBe('ready')
      expect(mockGetMagicAddress).not.toHaveBeenCalled()
    })
  })

  describe('when the user signed in with thirdweb and no wallet is connected', () => {
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
    })

    it('should leave the wallet choice to the user and never connect Magic', async () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('checking')
      await waitFor(() => expect(result.current.state).toBe('ready'))
      expect(mockConnectAsync).not.toHaveBeenCalled()
    })
  })

  describe('when a wallet other than the signed-in account is connected', () => {
    beforeEach(() => {
      mockAccount = { address: OTHER, connector: walletConnectConnector, status: 'connected' }
      mockConnections = [
        { accounts: [OTHER], connector: walletConnectConnector },
        { accounts: ['0x3333000000000000000000000000000000000003'], connector: metaMaskConnector },
        { accounts: [SIGNED_IN.toLowerCase()], connector: magicConnector }
      ]
    })

    it('should block signing once the account turns out not to be a Magic one', async () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      await waitFor(() => expect(result.current.state).toBe('mismatch'))
    })

    it('should block signing for a thirdweb login too', () => {
      mockUseIsThirdwebAccount.mockReturnValue(true)
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('mismatch')
    })

    it('should disconnect every wallet that is not the signed-in account', async () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
      await waitFor(() => expect(result.current.state).toBe('mismatch'))

      act(() => result.current.disconnect())

      expect(mockDisconnect).toHaveBeenCalledTimes(2)
      expect(mockDisconnect).toHaveBeenCalledWith({ connector: walletConnectConnector })
      expect(mockDisconnect).toHaveBeenCalledWith({ connector: metaMaskConnector })
    })
  })

  describe('when the signed-in account is the Magic account', () => {
    beforeEach(() => {
      mockGetMagicAddress.mockResolvedValue(SIGNED_IN.toLowerCase())
      mockAccount = { address: OTHER, connector: walletConnectConnector, status: 'connected' }
    })

    it('should connect Magic and switch it to the target network', async () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      await waitFor(() => expect(mockSwitchChainAsync).toHaveBeenCalledWith({ connector: magicConnector, chainId: TARGET_CHAIN }))
      expect(mockConnectAsync).toHaveBeenCalledWith({ connector: magicConnector, chainId: TARGET_CHAIN })
      expect(result.current.state).toBe('connecting')
    })

    it('should keep reporting connecting while wagmi reports its own connect in progress', async () => {
      mockConnectAsync.mockReturnValue(deferred().promise)
      const { result, rerender } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
      await waitFor(() => expect(mockConnectAsync).toHaveBeenCalled())

      mockAccount = { address: undefined, connector: undefined, status: 'connecting' }
      rerender()

      expect(result.current.state).toBe('connecting')
    })

    describe('and the connect fails after wagmi has already reset its status', () => {
      it('should try once and report failed', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        const attempt = deferred<unknown>()
        mockConnectAsync.mockReturnValue(attempt.promise)
        const { result, rerender } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
        await waitFor(() => expect(mockConnectAsync).toHaveBeenCalled())

        mockAccount = { address: undefined, connector: undefined, status: 'connecting' }
        rerender()
        mockAccount = { address: OTHER, connector: walletConnectConnector, status: 'connected' }
        rerender()
        await act(async () => attempt.reject(new Error('Magic: No accounts found')))

        expect(result.current.state).toBe('failed')
        expect(mockConnectAsync).toHaveBeenCalledTimes(1)
      })

      it('should connect again when the user retries', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
        mockConnectAsync.mockRejectedValueOnce(new Error('Magic: No accounts found'))
        const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
        await waitFor(() => expect(result.current.state).toBe('failed'))

        act(() => result.current.retry())

        await waitFor(() => expect(mockConnectAsync).toHaveBeenCalledTimes(2))
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

  describe('when the signed-in Magic wallet is already connected', () => {
    beforeEach(() => {
      mockAccount = { address: SIGNED_IN.toLowerCase(), chainId: TARGET_CHAIN, connector: magicConnector, status: 'connected' }
    })

    it('should switch it once to rebuild it on the target network, then be ready', async () => {
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      expect(result.current.state).toBe('connecting')
      await waitFor(() => expect(result.current.state).toBe('ready'))
      expect(mockSwitchChainAsync).toHaveBeenCalledTimes(1)
      expect(mockConnectAsync).not.toHaveBeenCalled()
    })

    it('should switch it back without asking when it moves to another network', async () => {
      const { result, rerender } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
      await waitFor(() => expect(result.current.state).toBe('ready'))

      mockAccount = { ...mockAccount, chainId: OTHER_CHAIN }
      rerender()

      expect(result.current.state).toBe('connecting')
      await waitFor(() => expect(mockSwitchChainAsync).toHaveBeenCalledTimes(2))
    })

    it('should report failed when the switch fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockSwitchChainAsync.mockRejectedValue(new Error('boom'))
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))

      await waitFor(() => expect(result.current.state).toBe('failed'))
    })
  })

  describe('when the signed-in account changes', () => {
    it('should look up Magic again instead of reusing the previous account', async () => {
      mockGetMagicAddress.mockResolvedValue(OTHER)
      const { result, rerender } = renderHook(({ session }) => useMagicSigner(session, TARGET_CHAIN), {
        initialProps: { session: SIGNED_IN }
      })
      await waitFor(() => expect(result.current.state).toBe('ready'))

      rerender({ session: OTHER })

      expect(result.current.state).toBe('checking')
      await waitFor(() => expect(mockGetMagicAddress).toHaveBeenCalledTimes(2))
    })
  })

  describe('when the Magic session check is slow', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should stop waiting after the timeout, and still connect Magic if the answer arrives later', async () => {
      const lookup = deferred<string | null>()
      mockGetMagicAddress.mockReturnValue(lookup.promise)
      const { result } = renderHook(() => useMagicSigner(SIGNED_IN, TARGET_CHAIN))
      expect(result.current.state).toBe('checking')

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })
      expect(result.current.state).toBe('ready')

      await act(async () => lookup.resolve(SIGNED_IN))
      expect(result.current.state).toBe('connecting')
    })
  })
})

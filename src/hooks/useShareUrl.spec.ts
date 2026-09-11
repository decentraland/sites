import { renderHook } from '@testing-library/react'
import { useShareUrl } from './useShareUrl'

const mockUseWalletAddress = jest.fn()
jest.mock('./useWalletAddress', () => ({
  useWalletAddress: () => mockUseWalletAddress()
}))

const WALLET = '0x1111111111111111111111111111111111111111'

describe('when building the link to hand to someone else', () => {
  beforeEach(() => {
    mockUseWalletAddress.mockReturnValue({ address: null, isConnected: false, disconnect: jest.fn() })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and nobody is connected', () => {
    it('should share the plain absolute URL, with nobody to credit', () => {
      const { result } = renderHook(() => useShareUrl('/places/world/foo.dcl.eth'))

      expect(result.current).toBe('http://localhost/places/world/foo.dcl.eth')
    })
  })

  describe('and the sharer is connected', () => {
    beforeEach(() => {
      mockUseWalletAddress.mockReturnValue({ address: WALLET, isConnected: true, disconnect: jest.fn() })
    })

    it('should credit them on the link', () => {
      const { result } = renderHook(() => useShareUrl('/places/world/foo.dcl.eth'))

      expect(result.current).toBe(`http://localhost/places/world/foo.dcl.eth?referrer=${WALLET}`)
    })

    it('should keep a target that is already absolute', () => {
      const { result } = renderHook(() => useShareUrl('https://decentraland.org/events?id=abc'))

      expect(result.current).toBe(`https://decentraland.org/events?id=abc&referrer=${WALLET}`)
    })

    it('should lowercase a checksummed address, the shape the installer chain expects', () => {
      mockUseWalletAddress.mockReturnValue({ address: WALLET.toUpperCase().replace('0X', '0x'), isConnected: true, disconnect: jest.fn() })
      const { result } = renderHook(() => useShareUrl('/places'))

      expect(result.current).toBe(`http://localhost/places?referrer=${WALLET}`)
    })

    it('should replace a referrer the target already carried rather than appending a second one', () => {
      const { result } = renderHook(() => useShareUrl('/places?referrer=0x2222222222222222222222222222222222222222'))

      expect(result.current).toBe(`http://localhost/places?referrer=${WALLET}`)
    })
  })

  describe('and the connected address is malformed', () => {
    it('should share the link uncredited instead of a param the installer chain would reject', () => {
      mockUseWalletAddress.mockReturnValue({ address: 'not-a-wallet', isConnected: true, disconnect: jest.fn() })
      const { result } = renderHook(() => useShareUrl('/places'))

      expect(result.current).toBe('http://localhost/places')
    })
  })
})

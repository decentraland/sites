import { act, renderHook, waitFor } from '@testing-library/react'
import { useManaBalances } from './useManaBalances'
import type { ManaBalances } from './useManaBalances.types'

// Mock the lazy-loaded impl so tests don't pull viem into the Jest bundle
// and we can control the fetch result deterministically.
const mockFetch = jest.fn<Promise<ManaBalances>, [string]>()
jest.mock('./useManaBalances.impl', () => ({
  fetchManaBalancesFromChain: (address: string) => mockFetch(address)
}))

describe('useManaBalances', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    jest.useRealTimers()
  })

  it('should initialize with no balances and not loading', () => {
    const { result } = renderHook(() => useManaBalances(undefined))
    expect(result.current.balances).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should skip fetching when the address is undefined', async () => {
    const { result } = renderHook(() => useManaBalances(undefined))
    await act(async () => {
      await result.current.fetchBalances()
    })
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.balances).toBeNull()
  })

  it('should populate balances from the dynamic import on first fetch', async () => {
    mockFetch.mockResolvedValueOnce({ ethereum: 12.5, polygon: 3 })

    const { result } = renderHook(() => useManaBalances('0xabc'))
    await act(async () => {
      await result.current.fetchBalances()
    })

    expect(mockFetch).toHaveBeenCalledWith('0xabc')
    await waitFor(() => expect(result.current.balances).toEqual({ ethereum: 12.5, polygon: 3 }))
    expect(result.current.isLoading).toBe(false)
  })

  it('should return the cached balances on a second call within the TTL without refetching', async () => {
    mockFetch.mockResolvedValueOnce({ ethereum: 1, polygon: 2 })

    const { result } = renderHook(() => useManaBalances('0xabc'))
    await act(async () => {
      await result.current.fetchBalances()
    })

    await act(async () => {
      await result.current.fetchBalances()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.balances).toEqual({ ethereum: 1, polygon: 2 })
  })

  it('should clear the cached balances when the address changes', async () => {
    mockFetch.mockResolvedValueOnce({ ethereum: 1, polygon: 2 })

    const { result, rerender } = renderHook(({ address }) => useManaBalances(address), {
      initialProps: { address: '0xabc' as string | undefined }
    })
    await act(async () => {
      await result.current.fetchBalances()
    })
    expect(result.current.balances).toEqual({ ethereum: 1, polygon: 2 })

    rerender({ address: '0xdef' })
    expect(result.current.balances).toBeNull()
  })

  it('should swallow fetch errors and keep the UI stable (MANA is non-critical)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('rpc down'))

    const { result } = renderHook(() => useManaBalances('0xabc'))
    await act(async () => {
      await result.current.fetchBalances()
    })

    expect(result.current.balances).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

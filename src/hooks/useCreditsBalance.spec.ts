import { renderHook, waitFor } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { fetchWithIdentity } from '../utils/signedFetch'
import { useCreditsBalance } from './useCreditsBalance'

jest.mock('../config/env', () => ({ getEnv: jest.fn(() => 'https://credits.example.com') }))
jest.mock('../utils/signedFetch', () => ({ fetchWithIdentity: jest.fn() }))

const mockFetchWithIdentity = jest.mocked(fetchWithIdentity)
const IDENTITY = { authChain: [] } as unknown as AuthIdentity

// The balance cache is keyed by address and lives at module scope (so route changes reuse it rather
// than re-signing). A shared address would therefore leak one case's result into the next, so each
// case gets its own wallet — which is also what distinct users actually look like.
let addressSeq = 0
const nextAddress = () => `0x${String(++addressSeq).padStart(40, '0')}`

// `cancel` is tracked because a path that never reads the body has to release the stream itself.
function jsonResponse(body: unknown, status = 200) {
  const cancel = jest.fn().mockResolvedValue(undefined)
  const response = { ok: status >= 200 && status < 300, status, body: { cancel }, json: async () => body } as unknown as Response
  return { response, cancel }
}

describe('useCreditsBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet holds credits', () => {
    it('should return the spendable USD credits', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ usd: { balanceCents: 13900, credits: 139 } }).response)

      const { result } = renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(result.current.credits).toBe(139))
    })
  })

  describe('and there is no wallet', () => {
    it('should not issue a request at all, so an anonymous visit costs nothing', async () => {
      const { result } = renderHook(() => useCreditsBalance(undefined, undefined))

      await waitFor(() => expect(result.current.credits).toBeNull())
      expect(mockFetchWithIdentity).not.toHaveBeenCalled()
    })
  })

  describe('and there is an address but no identity', () => {
    it('should not issue a request, since the credits-server needs a signature', async () => {
      const { result } = renderHook(() => useCreditsBalance(nextAddress(), undefined))

      await waitFor(() => expect(result.current.credits).toBeNull())
      expect(mockFetchWithIdentity).not.toHaveBeenCalled()
    })
  })

  describe('and the address is not a well-formed wallet address', () => {
    it('should not build a request from it', async () => {
      const { result } = renderHook(() => useCreditsBalance('../../admin', IDENTITY))

      await waitFor(() => expect(result.current.credits).toBeNull())
      expect(mockFetchWithIdentity).not.toHaveBeenCalled()
    })
  })

  // The address can land a render before the identity in any non-redirect connect flow. Reading the
  // identity only through a ref meant that first run bailed and never re-ran, leaving the chip hidden for
  // the rest of the session.
  describe('and the identity arrives after the address', () => {
    it('should fetch once it exists, instead of staying hidden for the session', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ usd: { balanceCents: 7000, credits: 70 } }).response)
      const address = nextAddress()

      const { result, rerender } = renderHook(({ id }) => useCreditsBalance(address, id), {
        initialProps: { id: undefined as AuthIdentity | undefined }
      })

      // Nothing yet: no identity to sign with.
      await waitFor(() => expect(result.current.credits).toBeNull())
      expect(mockFetchWithIdentity).not.toHaveBeenCalled()

      rerender({ id: IDENTITY })

      await waitFor(() => expect(result.current.credits).toBe(70))
    })

    it('should not refetch when the same wallet gets a fresh identity object', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ usd: { balanceCents: 3000, credits: 30 } }).response)
      const address = nextAddress()

      const { result, rerender } = renderHook(({ id }) => useCreditsBalance(address, id), {
        initialProps: { id: { authChain: [] } as unknown as AuthIdentity }
      })
      await waitFor(() => expect(result.current.credits).toBe(30))
      expect(mockFetchWithIdentity).toHaveBeenCalledTimes(1)

      // A different object for the same wallet must not re-sign — that is what the ref is for.
      rerender({ id: { authChain: [] } as unknown as AuthIdentity })

      await waitFor(() => expect(result.current.credits).toBe(30))
      expect(mockFetchWithIdentity).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the credits-server does not know the wallet', () => {
    it('should report zero, because a 404 is a real empty balance', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({}, 404).response)

      const { result } = renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(result.current.credits).toBe(0))
    })
  })

  describe('and the request fails', () => {
    it('should stay null rather than reporting 0, which would claim the wallet has none', async () => {
      mockFetchWithIdentity.mockRejectedValue(new Error('offline'))

      const { result } = renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(mockFetchWithIdentity).toHaveBeenCalled())
      expect(result.current.credits).toBeNull()
    })
  })

  describe('and the response carries no usd block', () => {
    it('should report zero, which is what an unflagged or never-granted wallet means', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ credits: [], totalCredits: 0 }).response)

      const { result } = renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(result.current.credits).toBe(0))
    })
  })

  // Reading the body is what normally releases the stream, so the paths that skip the read have to
  // release it themselves or the socket is held open.
  describe('and a response body is never read', () => {
    it('should release the stream on a 404', async () => {
      const { response, cancel } = jsonResponse({}, 404)
      mockFetchWithIdentity.mockResolvedValue(response)

      const { result } = renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(result.current.credits).toBe(0))
      expect(cancel).toHaveBeenCalled()
    })

    it('should release the stream on a server error', async () => {
      const { response, cancel } = jsonResponse({ error: 'boom' }, 500)
      mockFetchWithIdentity.mockResolvedValue(response)

      renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(cancel).toHaveBeenCalled())
    })
  })

  describe('and the same wallet is read twice inside the cache window', () => {
    it('should reuse the cached answer instead of re-signing', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ usd: { balanceCents: 5000, credits: 50 } }).response)
      const address = nextAddress()

      const first = renderHook(() => useCreditsBalance(address, IDENTITY))
      await waitFor(() => expect(first.result.current.credits).toBe(50))
      expect(mockFetchWithIdentity).toHaveBeenCalledTimes(1)

      const second = renderHook(() => useCreditsBalance(address, IDENTITY))

      await waitFor(() => expect(second.result.current.credits).toBe(50))
      expect(mockFetchWithIdentity).toHaveBeenCalledTimes(1)
    })

    it('should cache a 404 too, so an unknown wallet is not asked about again', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({}, 404).response)
      const address = nextAddress()

      const first = renderHook(() => useCreditsBalance(address, IDENTITY))
      await waitFor(() => expect(first.result.current.credits).toBe(0))
      expect(mockFetchWithIdentity).toHaveBeenCalledTimes(1)

      const second = renderHook(() => useCreditsBalance(address, IDENTITY))

      await waitFor(() => expect(second.result.current.credits).toBe(0))
      expect(mockFetchWithIdentity).toHaveBeenCalledTimes(1)
    })
  })
})

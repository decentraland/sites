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

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

describe('useCreditsBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when the wallet holds credits', () => {
    it('should return the spendable USD credits', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ usd: { balanceCents: 13900, credits: 139 } }))

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

  describe('and the credits-server does not know the wallet', () => {
    it('should report zero, because a 404 is a real empty balance', async () => {
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({}, 404))

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
      mockFetchWithIdentity.mockResolvedValue(jsonResponse({ credits: [], totalCredits: 0 }))

      const { result } = renderHook(() => useCreditsBalance(nextAddress(), IDENTITY))

      await waitFor(() => expect(result.current.credits).toBe(0))
    })
  })
})

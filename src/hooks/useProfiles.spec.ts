import { renderHook, waitFor } from '@testing-library/react'
import { getEnv } from '../config/env'
import { useProfile, useProfiles } from './useProfiles'

jest.mock('../config/env')

const mockGetEnv = jest.mocked(getEnv)

const PEER = 'https://peer.test'
const OTHER_PEER = 'https://peer.other.test'

// The store caches per (peer, address) for the lifetime of the module, so each case
// uses its own addresses rather than trying to reset shared state.
const addr = (seed: string) => `0x${seed.repeat(40).slice(0, 40)}`

function profileFor(address: string, name: string, hasClaimedName = true) {
  return {
    avatars: [{ ethAddress: address, name, hasClaimedName, avatar: { snapshots: { face256: `https://cdn.test/${name}.png` } } }]
  }
}

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as unknown as Response
}

describe('useProfiles', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    mockGetEnv.mockImplementation(key => (key === 'PEER_URL' ? PEER : undefined))
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when several addresses are requested together', () => {
    const a = addr('1')
    const b = addr('2')

    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([profileFor(a, 'alice'), profileFor(b, 'bob')]))
    })

    it('should resolve them with a single batched request', async () => {
      const { result } = renderHook(() => useProfiles([a, b]))

      await waitFor(() => expect(result.current.profiles.size).toBe(2))

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe(`${PEER}/lambdas/profiles`)
    })

    it('should flatten each profile to the fields the avatar surfaces render', async () => {
      const { result } = renderHook(() => useProfiles([a, b]))

      await waitFor(() => expect(result.current.profiles.size).toBe(2))

      expect(result.current.profiles.get(a)).toEqual({
        address: a,
        name: 'alice',
        hasClaimedName: true,
        avatarFace256: 'https://cdn.test/alice.png'
      })
    })
  })

  describe('when an address has no deployed profile', () => {
    const present = addr('3')
    const missing = addr('4')

    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([profileFor(present, 'carol')]))
    })

    it('should still settle it so callers can tell it apart from one still loading', async () => {
      const { result } = renderHook(() => useProfiles([present, missing]))

      await waitFor(() => expect(result.current.profiles.size).toBe(2))

      expect(result.current.profiles.get(missing)).toEqual({
        address: missing,
        name: undefined,
        hasClaimedName: false,
        avatarFace256: undefined
      })
    })
  })

  describe('when the response carries an avatar for an address that was not requested', () => {
    const requested = addr('5')
    const impostor = addr('6')

    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([profileFor(impostor, 'impostor')]))
    })

    it('should not let it claim the requested address row', async () => {
      const { result } = renderHook(() => useProfiles([requested]))

      await waitFor(() => expect(result.current.profiles.size).toBe(1))

      expect(result.current.profiles.get(requested)?.name).toBeUndefined()
    })
  })

  describe('when the batch request fails', () => {
    const failing = addr('7')

    beforeEach(() => {
      fetchMock.mockRejectedValue(new Error('network down'))
    })

    it('should surface an error instead of leaving callers waiting forever', async () => {
      const { result } = renderHook(() => useProfiles([failing]))

      await waitFor(() => expect(result.current.error).not.toBeNull())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('when a peer URL override is supplied', () => {
    const scoped = addr('8')

    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([profileFor(scoped, 'realm-local')]))
    })

    it('should read from that peer rather than the configured one', async () => {
      const { result } = renderHook(() => useProfiles([scoped], OTHER_PEER))

      await waitFor(() => expect(result.current.profiles.size).toBe(1))

      expect(fetchMock.mock.calls[0][0]).toBe(`${OTHER_PEER}/lambdas/profiles`)
    })
  })

  describe('when there are no addresses', () => {
    it('should resolve to an empty map without hitting the network', async () => {
      const { result } = renderHook(() => useProfiles([]))

      await waitFor(() => expect(result.current.profiles.size).toBe(0))

      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})

describe('useProfile', () => {
  let fetchMock: jest.Mock
  const single = addr('9')

  beforeEach(() => {
    mockGetEnv.mockImplementation(key => (key === 'PEER_URL' ? PEER : undefined))
    fetchMock = jest.fn().mockResolvedValue(jsonResponse([profileFor(single, 'solo')]))
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when an address is supplied', () => {
    it('should return that single profile', async () => {
      const { result } = renderHook(() => useProfile(single))

      await waitFor(() => expect(result.current.profile).not.toBeNull())

      expect(result.current.profile?.name).toBe('solo')
    })
  })

  describe('when no address is supplied', () => {
    it('should return no profile without hitting the network', async () => {
      const { result } = renderHook(() => useProfile(undefined))

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.profile).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })
})

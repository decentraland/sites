import { renderHook, waitFor } from '@testing-library/react'
import { getEnv } from '../../config/env'
import { useGetProfileQuery } from './profile.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const PEER = 'https://peer.decentraland.org'
const A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const C = '0xcccccccccccccccccccccccccccccccccccccccc'

function profileFor(address: string, name: string) {
  return { avatars: [{ ethAddress: address, name, hasClaimedName: true }] }
}

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as unknown as Response
}

describe('profile.client batching', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    mockGetEnv.mockImplementation(key => (key === 'PEER_URL' ? PEER : undefined))
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when several profiles are requested in the same tick', () => {
    it('should coalesce them into ONE batch POST and route each profile to its subscriber', async () => {
      fetchMock.mockResolvedValue(jsonResponse([profileFor(A, 'Alice'), profileFor(B, 'Bob')]))

      const first = renderHook(() => useGetProfileQuery(A))
      const second = renderHook(() => useGetProfileQuery(B))

      await waitFor(() => expect(first.result.current.isLoading).toBe(false))
      await waitFor(() => expect(second.result.current.isLoading).toBe(false))

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(`${PEER}/lambdas/profiles`)
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({ ids: [A, B] })
      expect(first.result.current.data?.avatars?.[0]?.name).toBe('Alice')
      expect(second.result.current.data?.avatars?.[0]?.name).toBe('Bob')
    })
  })

  describe('when an address has no deployed profile', () => {
    it('should resolve it as null (missing from the batch response)', async () => {
      fetchMock.mockResolvedValue(jsonResponse([profileFor(A, 'Alice')]))

      const hit = renderHook(() => useGetProfileQuery(A))
      const miss = renderHook(() => useGetProfileQuery(C))

      await waitFor(() => expect(miss.result.current.isLoading).toBe(false))

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(hit.result.current.data).not.toBeNull()
      expect(miss.result.current.data).toBeNull()
    })
  })

  describe('when the batch request fails', () => {
    it('should leave the entry uncached so a later subscriber retries', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'))

      const first = renderHook(() => useGetProfileQuery('0xdddddddddddddddddddddddddddddddddddddddd'))
      // The failed batch settles with no data and keeps the entry uncached, but flags
      // `hasError` so callers stop waiting instead of spinning forever.
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
      expect(first.result.current.data).toBeNull()
      first.unmount()

      // A later mount retries the fetch instead of reusing a pinned failure.
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { avatars: [{ ethAddress: '0xdddddddddddddddddddddddddddddddddddddddd', name: 'Recovered', avatar: { snapshots: {} } }] }
        ]
      } as unknown as Response)
      const second = renderHook(() => useGetProfileQuery('0xdddddddddddddddddddddddddddddddddddddddd'))
      await waitFor(() => expect(second.result.current.data).not.toBeNull())

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(second.result.current.data?.avatars?.[0]?.name).toBe('Recovered')
    })
  })
})

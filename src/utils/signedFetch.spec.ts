import type { AuthIdentity } from '@dcl/crypto'

const mockSignedFetch = jest.fn()
const mockSignedFetchFactory = jest.fn(() => mockSignedFetch)

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => mockSignedFetchFactory()
}))

describe('signedFetch', () => {
  const identity = { authChain: [], ephemeralIdentity: {} } as unknown as AuthIdentity
  const fetchMock = jest.fn()

  beforeEach(() => {
    jest.resetModules()
    mockSignedFetch.mockReset()
    mockSignedFetchFactory.mockClear()
    mockSignedFetchFactory.mockReturnValue(mockSignedFetch)
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('fetchWithIdentity', () => {
    it('should lazily import decentraland-crypto-fetch on first call and forward the request', async () => {
      mockSignedFetch.mockResolvedValueOnce({ ok: true } as Response)
      const { fetchWithIdentity } = await import('./signedFetch')

      await fetchWithIdentity('https://api.test/events', identity, 'POST', 'body', { 'x-key': '1' }, undefined)

      expect(mockSignedFetchFactory).toHaveBeenCalledTimes(1)
      expect(mockSignedFetch).toHaveBeenCalledWith('https://api.test/events', {
        method: 'POST',
        identity,
        body: 'body',
        headers: { 'x-key': '1' },
        signal: undefined
      })
    })

    it('should reuse the cached signedFetch instance across calls', async () => {
      mockSignedFetch.mockResolvedValue({ ok: true } as Response)
      const { fetchWithIdentity } = await import('./signedFetch')

      await fetchWithIdentity('https://api.test/a', identity, 'GET')
      await fetchWithIdentity('https://api.test/b', identity, 'GET')

      expect(mockSignedFetchFactory).toHaveBeenCalledTimes(1)
      expect(mockSignedFetch).toHaveBeenCalledTimes(2)
    })

    it('should forward the AbortSignal when provided', async () => {
      mockSignedFetch.mockResolvedValueOnce({ ok: true } as Response)
      const controller = new AbortController()
      const { fetchWithIdentity } = await import('./signedFetch')

      await fetchWithIdentity('https://api.test/x', identity, 'GET', undefined, undefined, controller.signal)

      expect(mockSignedFetch).toHaveBeenCalledWith(
        'https://api.test/x',
        expect.objectContaining({ method: 'GET', identity, signal: controller.signal })
      )
    })
  })

  describe('fetchWithOptionalIdentity', () => {
    it('should use signedFetch when an identity is provided', async () => {
      mockSignedFetch.mockResolvedValueOnce({ ok: true } as Response)
      const { fetchWithOptionalIdentity } = await import('./signedFetch')

      await fetchWithOptionalIdentity('https://api.test/me', identity, undefined)

      expect(mockSignedFetch).toHaveBeenCalledWith('https://api.test/me', {
        method: 'GET',
        identity,
        signal: undefined
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should fall through to plain fetch when identity is undefined', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)
      const { fetchWithOptionalIdentity } = await import('./signedFetch')

      await fetchWithOptionalIdentity('https://api.test/public', undefined, undefined)

      expect(fetchMock).toHaveBeenCalledWith('https://api.test/public', { signal: undefined })
      expect(mockSignedFetchFactory).not.toHaveBeenCalled()
    })

    it('should forward the AbortSignal to plain fetch when no identity is provided', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as Response)
      const controller = new AbortController()
      const { fetchWithOptionalIdentity } = await import('./signedFetch')

      await fetchWithOptionalIdentity('https://api.test/public', undefined, controller.signal)

      expect(fetchMock).toHaveBeenCalledWith('https://api.test/public', { signal: controller.signal })
    })
  })

  describe('when the dynamic import fails on the first attempt', () => {
    it('should clear the cached loader so a retry can recover', async () => {
      jest.resetModules()
      const failingFactory = jest.fn(() => {
        throw new Error('factory boom')
      })
      jest.doMock('decentraland-crypto-fetch', () => ({
        signedFetchFactory: failingFactory
      }))
      const { fetchWithIdentity } = await import('./signedFetch')

      await expect(fetchWithIdentity('https://api.test/x', identity, 'GET')).rejects.toThrow('factory boom')

      jest.resetModules()
      const recoveredFetch = jest.fn().mockResolvedValueOnce({ ok: true } as Response)
      jest.doMock('decentraland-crypto-fetch', () => ({
        signedFetchFactory: () => recoveredFetch
      }))
      const retry = await import('./signedFetch')
      await retry.fetchWithIdentity('https://api.test/x', identity, 'GET')
      expect(recoveredFetch).toHaveBeenCalled()
    })
  })
})

const mockGetEnv = jest.fn()

jest.mock('../../../config/env', () => ({ getEnv: (key: string) => mockGetEnv(key) }))

import { fetchTransakUrl, getMoonPayUrl } from './buyMana.helpers'

const ENV: Record<string, string> = {
  MOON_PAY_WIDGET_URL: 'https://buy.moonpay.test',
  MOON_PAY_API_KEY: 'pk_test_123',
  MARKETPLACE_API_URL: 'https://market-api.test'
}

let fetchMock: jest.Mock

beforeEach(() => {
  mockGetEnv.mockImplementation((key: string) => ENV[key] ?? '')
  fetchMock = jest.fn()
  global.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('buyMana.helpers', () => {
  describe('getMoonPayUrl', () => {
    it('should build the MoonPay hosted checkout url with apiKey, MANA and the wallet address', () => {
      const url = getMoonPayUrl('0xUSER')
      expect(url.startsWith('https://buy.moonpay.test?')).toBe(true)
      const params = new URL(url).searchParams
      expect(params.get('apiKey')).toBe('pk_test_123')
      expect(params.get('currencyCode')).toBe('MANA')
      expect(params.get('walletAddress')).toBe('0xUSER')
    })

    it('should throw when the MoonPay env is missing', () => {
      mockGetEnv.mockReturnValue('')
      expect(() => getMoonPayUrl('0xUSER')).toThrow()
    })
  })

  describe('fetchTransakUrl', () => {
    it('should POST the network + address and return the url from the { ok, data } response', async () => {
      fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ ok: true, data: 'https://global-stg.transak.com/?x=1' }) })
      const url = await fetchTransakUrl('polygon', '0xUSER')
      expect(url).toBe('https://global-stg.transak.com/?x=1')
      const [endpoint, init] = fetchMock.mock.calls[0]
      expect(endpoint).toBe('https://market-api.test/v1/transak/widget-url')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({ defaultNetwork: 'polygon', walletAddress: '0xUSER' })
    })

    it('should map the ethereum network and accept a { url } object response', async () => {
      fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ url: 'https://global.transak.com/eth' }) })
      const url = await fetchTransakUrl('ethereum', '0xUSER')
      expect(url).toBe('https://global.transak.com/eth')
      expect(JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body).defaultNetwork).toBe('ethereum')
    })

    it('should accept a bare JSON string and a plain-text url body', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify('https://global.transak.com/str') })
      await expect(fetchTransakUrl('ethereum', '0xUSER')).resolves.toBe('https://global.transak.com/str')
      fetchMock.mockResolvedValueOnce({ ok: true, text: async () => 'https://global.transak.com/plain' })
      await expect(fetchTransakUrl('ethereum', '0xUSER')).resolves.toBe('https://global.transak.com/plain')
    })

    it('should throw on a non-ok response', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => '' })
      await expect(fetchTransakUrl('ethereum', '0xUSER')).rejects.toThrow()
    })

    it('should throw when the response carries no usable url', async () => {
      fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ ok: true, data: { nested: true } }) })
      await expect(fetchTransakUrl('ethereum', '0xUSER')).rejects.toThrow()
    })

    it('should reject a url whose host is not a Transak domain', async () => {
      fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ ok: true, data: 'https://evil.example.com/widget' }) })
      await expect(fetchTransakUrl('ethereum', '0xUSER')).rejects.toThrow()
    })

    it('should reject a non-https Transak url', async () => {
      fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ ok: true, data: 'http://global.transak.com/widget' }) })
      await expect(fetchTransakUrl('ethereum', '0xUSER')).rejects.toThrow()
    })
  })
})

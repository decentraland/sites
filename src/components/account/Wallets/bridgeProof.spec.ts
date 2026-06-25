let mockEnv: string
const mockGetEnv = jest.fn()

jest.mock('@dcl/ui-env', () => ({ Env: { PRODUCTION: 'prod' } }))
jest.mock('../../../config/env', () => ({ getCurrentEnv: () => mockEnv, getEnv: (key: string) => mockGetEnv(key) }))

import { ERC20_TRANSFER_EVENT_SIG, fetchExitPayload, getProofApiNetwork, isWithdrawClaimable } from './bridgeProof'

let fetchMock: jest.Mock

beforeEach(() => {
  mockEnv = 'prod'
  mockGetEnv.mockReturnValue('https://proof.test')
  fetchMock = jest.fn()
  global.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('bridgeProof', () => {
  describe('getProofApiNetwork', () => {
    it('should use matic on production and amoy otherwise', () => {
      mockEnv = 'prod'
      expect(getProofApiNetwork()).toBe('matic')
      mockEnv = 'dev'
      expect(getProofApiNetwork()).toBe('amoy')
    })
  })

  describe('fetchExitPayload', () => {
    it('should return the payload and pass the Transfer event signature + tokenIndex', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: '0xpayload' }) })
      await expect(fetchExitPayload('0xburn')).resolves.toBe('0xpayload')
      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('/api/v1/matic/exit-payload/0xburn')
      expect(url).toContain(`eventSignature=${ERC20_TRANSFER_EVENT_SIG}`)
      expect(url).toContain('tokenIndex=0')
    })

    it('should return null when the burn is not checkpointed yet (200 + error body)', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ error: true, message: 'Burn transaction has not been checkpointed yet' })
      })
      await expect(fetchExitPayload('0xburn')).resolves.toBeNull()
    })

    it('should return null when there is no payload and no explicit error', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ message: 'pending' }) })
      await expect(fetchExitPayload('0xburn')).resolves.toBeNull()
    })

    it('should throw on a non-ok response without a usable body', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => null })
      await expect(fetchExitPayload('0xburn')).rejects.toThrow()
    })
  })

  describe('isWithdrawClaimable', () => {
    it('should be true once a payload can be generated', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: '0xpayload' }) })
      await expect(isWithdrawClaimable('0xburn')).resolves.toBe(true)
    })

    it('should be false while the burn is not checkpointed yet', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ error: true }) })
      await expect(isWithdrawClaimable('0xburn')).resolves.toBe(false)
    })

    it('should be false on a transport error', async () => {
      fetchMock.mockRejectedValue(new Error('network'))
      await expect(isWithdrawClaimable('0xburn')).resolves.toBe(false)
    })
  })
})

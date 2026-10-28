import type { AuthIdentity } from '@dcl/crypto'
import { deleteMagicAccount } from './accountDeletion'

const mockFetchWithIdentity = jest.fn()
const mockGetEnv = jest.fn()

jest.mock('../utils/signedFetch', () => ({
  fetchWithIdentity: (...args: unknown[]) => mockFetchWithIdentity(...args)
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => mockGetEnv(key)
}))

describe('deleteMagicAccount', () => {
  const identity = {} as AuthIdentity

  beforeEach(() => {
    mockGetEnv.mockReturnValue('https://auth-api.decentraland.zone')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should send a signed DELETE to /accounts with the DID token in the metadata', async () => {
    mockFetchWithIdentity.mockResolvedValue({ ok: true })

    await deleteMagicAccount(identity, 'did-token-xyz')

    expect(mockFetchWithIdentity).toHaveBeenCalledWith(
      'https://auth-api.decentraland.zone/accounts',
      identity,
      'DELETE',
      undefined,
      undefined,
      undefined,
      { didToken: 'did-token-xyz' }
    )
  })

  it('should throw with the server error message on failure', async () => {
    mockFetchWithIdentity.mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'Origin not allowed' }) })

    await expect(deleteMagicAccount(identity, 'did-token-xyz')).rejects.toThrow('Origin not allowed')
  })

  it('should throw when AUTH_SERVER_URL is not set', async () => {
    mockGetEnv.mockReturnValue(undefined)

    await expect(deleteMagicAccount(identity, 'did-token-xyz')).rejects.toThrow('AUTH_SERVER_URL')
  })
})

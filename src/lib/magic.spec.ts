import { getMagicDidToken } from './magic'

const mockIsLoggedIn = jest.fn()
const mockGetIdToken = jest.fn()
const mockGetEnv = jest.fn()

jest.mock('magic-sdk', () => ({
  Magic: jest.fn().mockImplementation(() => ({
    user: { isLoggedIn: mockIsLoggedIn, getIdToken: mockGetIdToken }
  }))
}))

jest.mock('@magic-ext/oauth2', () => ({
  OAuthExtension: jest.fn()
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => mockGetEnv(key)
}))

describe('getMagicDidToken', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue('pk_live_test')
    mockIsLoggedIn.mockResolvedValue(true)
    mockGetIdToken.mockResolvedValue('did-token-123')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve with the DID token when the user is logged in', async () => {
    await expect(getMagicDidToken()).resolves.toBe('did-token-123')
  })

  it('should throw when MAGIC_API_KEY is not set', async () => {
    mockGetEnv.mockReturnValue(undefined)

    await expect(getMagicDidToken()).rejects.toThrow('MAGIC_API_KEY')
  })

  it('should throw and not mint a token when the user is not logged in', async () => {
    mockIsLoggedIn.mockResolvedValue(false)

    await expect(getMagicDidToken()).rejects.toThrow('not logged in')
    expect(mockGetIdToken).not.toHaveBeenCalled()
  })
})

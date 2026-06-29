import { getMagicDidToken, isMagicLoggedIn } from './magic'

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

describe('isMagicLoggedIn', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue('pk_live_test')
    mockIsLoggedIn.mockResolvedValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve true when there is an active Magic session', async () => {
    await expect(isMagicLoggedIn()).resolves.toBe(true)
  })

  it('should resolve false when there is no active Magic session', async () => {
    mockIsLoggedIn.mockResolvedValue(false)

    await expect(isMagicLoggedIn()).resolves.toBe(false)
  })

  it('should resolve false (instead of throwing) when MAGIC_API_KEY is not set', async () => {
    mockGetEnv.mockReturnValue(undefined)

    await expect(isMagicLoggedIn()).resolves.toBe(false)
    expect(mockIsLoggedIn).not.toHaveBeenCalled()
  })

  it('should resolve false when the session check throws', async () => {
    mockIsLoggedIn.mockRejectedValue(new Error('iframe unreachable'))

    await expect(isMagicLoggedIn()).resolves.toBe(false)
  })
})

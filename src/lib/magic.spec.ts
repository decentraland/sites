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

// Re-imported per test (after resetModules) so the module-level Magic singleton starts fresh and the
// cache does not bleed across tests.
const importFreshMagic = async (): Promise<typeof import('./magic')> => {
  jest.resetModules()
  return import('./magic')
}

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
    const { getMagicDidToken } = await importFreshMagic()

    await expect(getMagicDidToken()).resolves.toBe('did-token-123')
  })

  it('should throw when MAGIC_API_KEY is not set', async () => {
    mockGetEnv.mockReturnValue(undefined)
    const { getMagicDidToken } = await importFreshMagic()

    await expect(getMagicDidToken()).rejects.toThrow('MAGIC_API_KEY')
  })

  it('should throw and not mint a token when the user is not logged in', async () => {
    mockIsLoggedIn.mockResolvedValue(false)
    const { getMagicDidToken } = await importFreshMagic()

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
    const { isMagicLoggedIn } = await importFreshMagic()

    await expect(isMagicLoggedIn()).resolves.toBe(true)
  })

  it('should resolve false when there is no active Magic session', async () => {
    mockIsLoggedIn.mockResolvedValue(false)
    const { isMagicLoggedIn } = await importFreshMagic()

    await expect(isMagicLoggedIn()).resolves.toBe(false)
  })

  it('should resolve false (instead of throwing) when MAGIC_API_KEY is not set', async () => {
    mockGetEnv.mockReturnValue(undefined)
    const { isMagicLoggedIn } = await importFreshMagic()

    await expect(isMagicLoggedIn()).resolves.toBe(false)
    expect(mockIsLoggedIn).not.toHaveBeenCalled()
  })

  it('should resolve false when the session check throws', async () => {
    mockIsLoggedIn.mockRejectedValue(new Error('iframe unreachable'))
    const { isMagicLoggedIn } = await importFreshMagic()

    await expect(isMagicLoggedIn()).resolves.toBe(false)
  })
})

describe('Magic instance caching', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue('pk_live_test')
    mockIsLoggedIn.mockResolvedValue(true)
    mockGetIdToken.mockResolvedValue('did-token-123')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should construct the Magic SDK only once across multiple calls', async () => {
    const { isMagicLoggedIn, getMagicDidToken } = await importFreshMagic()
    const { Magic } = await import('magic-sdk')

    await isMagicLoggedIn()
    await isMagicLoggedIn()
    await getMagicDidToken()

    expect(Magic).toHaveBeenCalledTimes(1)
  })

  it('should not cache a failed bootstrap so a later call can retry', async () => {
    mockGetEnv.mockReturnValueOnce(undefined)
    const { isMagicLoggedIn } = await importFreshMagic()
    const { Magic } = await import('magic-sdk')

    await expect(isMagicLoggedIn()).resolves.toBe(false)
    await expect(isMagicLoggedIn()).resolves.toBe(true)

    expect(Magic).toHaveBeenCalledTimes(1)
  })
})

const mockInitializeAuthChain = jest.fn()
const mockCreateUnsafeIdentity = jest.fn()
const mockEthSign = jest.fn()

jest.mock('@dcl/crypto', () => ({
  Authenticator: {
    initializeAuthChain: (...args: unknown[]) => mockInitializeAuthChain(...args)
  }
}))
jest.mock('@dcl/crypto/dist/crypto', () => ({
  createUnsafeIdentity: () => mockCreateUnsafeIdentity(),
  ethSign: (...args: unknown[]) => mockEthSign(...args)
}))

// The module caches the minted identity at module level, so every test gets a
// fresh module instance via `jest.isolateModulesAsync`.
const fakeIdentity = { authChain: [{ payload: 'guest-chain' }] }

describe('guestIdentity', () => {
  beforeEach(() => {
    mockCreateUnsafeIdentity
      .mockReturnValueOnce({ address: '0xowner', publicKey: '0xownerpub', privateKey: '0x0aff' })
      .mockReturnValueOnce({ address: '0xsession', publicKey: '0xsessionpub', privateKey: '0xsessionpriv' })
    mockInitializeAuthChain.mockResolvedValue(fakeIdentity)
    mockEthSign.mockReturnValue('0xsignature')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when minting the guest identity for the first time', () => {
    it('should initialize the auth chain with the owner address, the session key and a 24h lifespan', async () => {
      await jest.isolateModulesAsync(async () => {
        const { getGuestIdentity } = await import('./guestIdentity')

        const identity = await getGuestIdentity()

        expect(identity).toBe(fakeIdentity)
        expect(mockInitializeAuthChain).toHaveBeenCalledWith(
          '0xowner',
          { address: '0xsession', publicKey: '0xsessionpub', privateKey: '0xsessionpriv' },
          60 * 24,
          expect.any(Function)
        )
      })
    })

    it('should sign chain messages with the owner private key decoded from hex', async () => {
      await jest.isolateModulesAsync(async () => {
        const { getGuestIdentity } = await import('./guestIdentity')

        await getGuestIdentity()
        const signer = mockInitializeAuthChain.mock.calls[0][3] as (message: string) => Promise<string>
        const signature = await signer('Decentraland Login')

        // '0x0aff' → strips the 0x prefix, decodes to the [0x0a, 0xff] bytes.
        expect(mockEthSign).toHaveBeenCalledWith(new Uint8Array([0x0a, 0xff]), 'Decentraland Login')
        expect(signature).toBe('0xsignature')
      })
    })
  })

  describe('when requesting the identity again in the same tab', () => {
    it('should reuse the cached identity without minting new keys', async () => {
      await jest.isolateModulesAsync(async () => {
        const { getGuestIdentity } = await import('./guestIdentity')

        const first = await getGuestIdentity()
        const second = await getGuestIdentity()

        expect(second).toBe(first)
        // Two calls (owner + session) from the FIRST mint only.
        expect(mockCreateUnsafeIdentity).toHaveBeenCalledTimes(2)
        expect(mockInitializeAuthChain).toHaveBeenCalledTimes(1)
      })
    })
  })
})

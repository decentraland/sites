/**
 * Regression test for the issue #505 Vite CJS-interop trap.
 *
 * `decentraland-crypto-fetch` exports the signed-fetch function as
 * `module.exports.default`. Jest (with esModuleInterop) and Rollup (production
 * build) both unwrap that to the function when you do `import x from 'lib'`.
 * Vite's dev pre-bundler does NOT — it wraps the whole CJS `exports` object as
 * the default, so `signedFetchLib(...)` throws "is not a function" and the
 * dialog ends up reporting "Unauthorized" without any signed request leaving
 * the client. The helper guards against that by reaching into `.default` when
 * the import resolves to a module-shaped object.
 */

const innerFn = jest.fn()

jest.mock('decentraland-crypto-fetch', () => ({
  // Simulate Vite's interop: default-import resolves to an object, not the function.
  __esModule: true,
  default: { __esModule: true, default: innerFn, signedFetchFactory: () => innerFn }
}))
jest.mock('../../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))

import { createScopedSignedFetch } from './storage.helpers'

const validIdentity = {
  ephemeralIdentity: {},
  authChain: [],
  expiration: new Date(Date.now() + 60_000)
} as unknown as Parameters<typeof createScopedSignedFetch>[0]

describe('createScopedSignedFetch — decentraland-crypto-fetch CJS interop', () => {
  beforeEach(() => innerFn.mockReset())

  it('still calls the underlying signed-fetch function when Vite hands us the module-shaped default', async () => {
    innerFn.mockResolvedValue({ ok: true, status: 200, text: async () => '{}', json: async () => ({}) } as unknown as Response)
    const sf = createScopedSignedFetch(validIdentity, 'brai.dcl.eth', '0,0')
    await sf('https://example/api', { method: 'PUT' })
    expect(innerFn).toHaveBeenCalledWith('https://example/api', expect.objectContaining({ method: 'PUT', identity: validIdentity }))
  })
})

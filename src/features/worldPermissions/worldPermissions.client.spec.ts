jest.mock('decentraland-crypto-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
  signedFetchFactory: () => jest.fn()
}))
jest.mock('../../config/env', () => ({
  getEnv: jest.fn(() => 'https://wcs.test')
}))
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: jest.fn()
}))

const mockSendSignedFetch = jest.fn()
const mockCreateScopedSignedFetch = jest.fn((..._args: unknown[]) => jest.fn())
jest.mock('../storage/storage.helpers', () => ({
  createScopedSignedFetch: (...args: unknown[]) => mockCreateScopedSignedFetch(...args),
  sendSignedFetch: (...args: unknown[]) => mockSendSignedFetch(...args)
}))

import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { storageClient } from '../../services/storageClient'
import {
  useAddWorldPermissionMutation,
  useGetWorldPermissionsQuery,
  useRemoveWorldPermissionMutation,
  worldPermissionsEndpoints
} from './worldPermissions.client'

function makeStore() {
  return configureStore({
    reducer: { [storageClient.reducerPath]: storageClient.reducer },
    middleware: getDefault => getDefault().concat(storageClient.middleware)
  })
}

describe('worldPermissions.client', () => {
  // clearAllMocks (not resetAllMocks) so the jest.mock-factory `getEnv` keeps
  // its implementation across tests; each test sets its own global.fetch.
  afterEach(() => jest.clearAllMocks())

  it('should register the three permission endpoints on the storage client', () => {
    expect(storageClient.endpoints).toHaveProperty('getWorldPermissions')
    expect(storageClient.endpoints).toHaveProperty('addWorldPermission')
    expect(storageClient.endpoints).toHaveProperty('removeWorldPermission')
  })

  it('should expose the generated hooks', () => {
    expect(typeof useGetWorldPermissionsQuery).toBe('function')
    expect(typeof useAddWorldPermissionMutation).toBe('function')
    expect(typeof useRemoveWorldPermissionMutation).toBe('function')
  })

  describe('getWorldPermissions queryFn', () => {
    it('should fetch the public permissions and return them', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              permissions: {
                deployment: { type: 'allow-list', wallets: ['0x1'] },
                streaming: { type: 'allow-list', wallets: [] },
                access: { type: 'unrestricted' }
              },
              owner: '0xowner'
            }),
          text: () => Promise.resolve('')
        } as Response)
      ) as unknown as typeof fetch
      const store = makeStore()
      const result = await store.dispatch(worldPermissionsEndpoints.endpoints.getWorldPermissions.initiate({ worldName: 'W.dcl.eth' }))
      expect(result.data?.permissions.deployment.wallets).toEqual(['0x1'])
      expect(result.data?.permissions.access.type).toBe('unrestricted')
    })

    it('should error on a non-ok response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('nope') } as Response)
      ) as unknown as typeof fetch
      const store = makeStore()
      const result = await store.dispatch(worldPermissionsEndpoints.endpoints.getWorldPermissions.initiate({ worldName: 'gone.dcl.eth' }))
      expect(result.isError).toBe(true)
    })

    it('should swallow a failing text() body on a non-ok response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({ ok: false, status: 500, text: () => Promise.reject(new Error('no body')) } as unknown as Response)
      ) as unknown as typeof fetch
      const store = makeStore()
      const result = await store.dispatch(worldPermissionsEndpoints.endpoints.getWorldPermissions.initiate({ worldName: 'w.dcl.eth' }))
      expect(result.error).toMatchObject({ status: 500, data: undefined })
    })

    it('should map a thrown fetch error to a FETCH_ERROR status', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('network down'))) as unknown as typeof fetch
      const store = makeStore()
      const result = await store.dispatch(worldPermissionsEndpoints.endpoints.getWorldPermissions.initiate({ worldName: 'w.dcl.eth' }))
      expect(result.isError).toBe(true)
      expect(result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('addWorldPermission mutation', () => {
    const identity = {} as AuthIdentity

    it('should PUT the permission for the address scoped to the wallet identity', async () => {
      mockSendSignedFetch.mockResolvedValue(undefined)
      const store = makeStore()
      const result = await store.dispatch(
        worldPermissionsEndpoints.endpoints.addWorldPermission.initiate({
          identity,
          worldName: 'W.dcl.eth',
          permission: 'deployment',
          address: '0xabc'
        })
      )
      expect('error' in result && result.error).toBeFalsy()
      expect(mockCreateScopedSignedFetch).toHaveBeenCalledWith(identity)
      const [, url, init] = mockSendSignedFetch.mock.calls[0]
      expect(url).toBe('https://wcs.test/world/w.dcl.eth/permissions/deployment/0xabc')
      expect(init).toEqual({ method: 'PUT' })
    })

    it('should surface a signed-fetch error', async () => {
      mockSendSignedFetch.mockRejectedValue({ status: 401, message: 'Unauthorized' })
      const store = makeStore()
      const result = await store.dispatch(
        worldPermissionsEndpoints.endpoints.addWorldPermission.initiate({
          identity,
          worldName: 'w.dcl.eth',
          permission: 'streaming',
          address: '0xabc'
        })
      )
      expect('error' in result && result.error).toMatchObject({ status: 401 })
    })
  })

  describe('removeWorldPermission mutation', () => {
    const identity = {} as AuthIdentity

    it('should DELETE the permission for the address', async () => {
      mockSendSignedFetch.mockResolvedValue(undefined)
      const store = makeStore()
      const result = await store.dispatch(
        worldPermissionsEndpoints.endpoints.removeWorldPermission.initiate({
          identity,
          worldName: 'w.dcl.eth',
          permission: 'access',
          address: '0xdef'
        })
      )
      expect('error' in result && result.error).toBeFalsy()
      const [, url, init] = mockSendSignedFetch.mock.calls[0]
      expect(url).toBe('https://wcs.test/world/w.dcl.eth/permissions/access/0xdef')
      expect(init).toEqual({ method: 'DELETE' })
    })

    it('should surface a signed-fetch error', async () => {
      mockSendSignedFetch.mockRejectedValue({ status: 403, message: 'Forbidden' })
      const store = makeStore()
      const result = await store.dispatch(
        worldPermissionsEndpoints.endpoints.removeWorldPermission.initiate({
          identity,
          worldName: 'w.dcl.eth',
          permission: 'deployment',
          address: '0xdef'
        })
      )
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })
  })
})

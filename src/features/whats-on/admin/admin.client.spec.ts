import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../../../config/env'
import { adminClient } from './admin.client'

jest.mock('../../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const mockFetchWithIdentity = jest.fn()
jest.mock('../../../utils/signedFetch', () => ({
  fetchWithIdentity: (...args: unknown[]) => mockFetchWithIdentity(...args)
}))

const buildStore = () =>
  configureStore({
    reducer: { [adminClient.reducerPath]: adminClient.reducer },
    middleware: getDefault => getDefault().concat(adminClient.middleware)
  })

describe('when calling admin profile settings endpoints', () => {
  let store: ReturnType<typeof buildStore>
  let identity: AuthIdentity

  beforeEach(() => {
    store = buildStore()
    mockGetEnv.mockReturnValue('https://events.test')
    identity = { authChain: [{ type: 'SIGNER', payload: '0xabc', signature: '' }] } as unknown as AuthIdentity
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and dispatching getMyProfileSettings', () => {
    describe('and the API responds OK', () => {
      beforeEach(() => {
        mockFetchWithIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { user: '0xabc', email: null, permissions: [] } })
        })
      })

      it('should issue a GET to /profiles/me/settings', async () => {
        await store.dispatch(adminClient.endpoints.getMyProfileSettings.initiate({ identity }))
        expect(mockFetchWithIdentity).toHaveBeenCalledWith('https://events.test/profiles/me/settings', identity, 'GET')
      })
    })
  })

  describe('and dispatching listAdmins', () => {
    describe('and the API responds OK', () => {
      beforeEach(() => {
        mockFetchWithIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] })
        })
      })

      it('should issue a GET to /profiles/settings', async () => {
        await store.dispatch(adminClient.endpoints.listAdmins.initiate({ identity }))
        expect(mockFetchWithIdentity).toHaveBeenCalledWith('https://events.test/profiles/settings', identity, 'GET')
      })
    })
  })
})

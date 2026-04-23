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

  describe('and dispatching updateAdminPermissions', () => {
    describe('and the API accepts the request', () => {
      let address: string

      beforeEach(() => {
        address = '0xABC'
        mockFetchWithIdentity.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              data: { user: address.toLowerCase(), email: null, permissions: ['approve_any_event'] }
            })
        })
      })

      it('should PATCH the lowercased address with the permissions body', async () => {
        await store.dispatch(
          adminClient.endpoints.updateAdminPermissions.initiate({
            address,
            permissions: ['approve_any_event' as never],
            identity
          })
        )
        expect(mockFetchWithIdentity).toHaveBeenCalledWith(
          'https://events.test/profiles/0xabc/settings',
          identity,
          'PATCH',
          JSON.stringify({ permissions: ['approve_any_event'] }),
          { 'Content-Type': 'application/json' }
        )
      })
    })
  })

  describe('and dispatching getAdminEvents', () => {
    describe('and the API responds OK', () => {
      beforeEach(() => {
        mockFetchWithIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        })
      })

      it('should GET /events using the signed identity so the backend grants allow_pending for admins', async () => {
        await store.dispatch(adminClient.endpoints.getAdminEvents.initiate({ identity }))
        expect(mockFetchWithIdentity).toHaveBeenCalledWith(expect.stringMatching(/\/events$/), identity, 'GET')
      })
    })
  })

  describe('and dispatching approveEvent', () => {
    beforeEach(() => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    })

    it('should PATCH /events/:id with { approved: true } and url-encode the id', async () => {
      await store.dispatch(adminClient.endpoints.approveEvent.initiate({ eventId: 'abc 1', identity }))
      expect(mockFetchWithIdentity).toHaveBeenCalledWith(
        'https://events.test/events/abc%201',
        identity,
        'PATCH',
        JSON.stringify({ approved: true }),
        { 'Content-Type': 'application/json' }
      )
    })
  })

  describe('and dispatching rejectEvent', () => {
    beforeEach(() => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    })

    it('should PATCH /events/:id with { rejected: true }', async () => {
      await store.dispatch(adminClient.endpoints.rejectEvent.initiate({ eventId: 'abc', identity }))
      expect(mockFetchWithIdentity).toHaveBeenCalledWith(
        'https://events.test/events/abc',
        identity,
        'PATCH',
        JSON.stringify({ rejected: true }),
        { 'Content-Type': 'application/json' }
      )
    })
  })
})

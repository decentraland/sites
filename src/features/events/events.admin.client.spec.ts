import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../../config/env'
import { adminClient } from './events.admin.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const mockFetchWithIdentity = jest.fn()
jest.mock('../../utils/signedFetch', () => ({
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

    it('should PATCH /events/:id with { rejected: true } when no reason is provided', async () => {
      await store.dispatch(adminClient.endpoints.rejectEvent.initiate({ eventId: 'abc', identity }))
      expect(mockFetchWithIdentity).toHaveBeenCalledWith(
        'https://events.test/events/abc',
        identity,
        'PATCH',
        JSON.stringify({ rejected: true }),
        { 'Content-Type': 'application/json' }
      )
    })

    it('should PATCH with rejection_reason trimmed when reason is provided', async () => {
      await store.dispatch(adminClient.endpoints.rejectEvent.initiate({ eventId: 'abc', identity, reason: '  Invalid image. extra  ' }))
      expect(mockFetchWithIdentity).toHaveBeenCalledWith(
        'https://events.test/events/abc',
        identity,
        'PATCH',
        JSON.stringify({ rejected: true, rejection_reason: 'Invalid image. extra' }),
        { 'Content-Type': 'application/json' }
      )
    })

    it('should omit rejection_reason when reason is whitespace only', async () => {
      await store.dispatch(adminClient.endpoints.rejectEvent.initiate({ eventId: 'abc', identity, reason: '   ' }))
      expect(mockFetchWithIdentity).toHaveBeenCalledWith(
        'https://events.test/events/abc',
        identity,
        'PATCH',
        JSON.stringify({ rejected: true }),
        { 'Content-Type': 'application/json' }
      )
    })
  })

  describe('and the API responds with a non-2xx', () => {
    it('should surface a numeric status for approveEvent', async () => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: false, status: 500 })
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const result = await store.dispatch(adminClient.endpoints.approveEvent.initiate({ eventId: 'abc', identity }))
      expect(result.error).toEqual(expect.objectContaining({ status: 500 }))
    })

    it('should surface a numeric status for updateAdminPermissions', async () => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: false, status: 403 })
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const result = await store.dispatch(
        adminClient.endpoints.updateAdminPermissions.initiate({ address: '0xabc', permissions: [], identity })
      )
      expect(result.error).toEqual(expect.objectContaining({ status: 403 }))
    })

    it('should surface FETCH_ERROR for getMyProfileSettings when fetch rejects', async () => {
      mockFetchWithIdentity.mockRejectedValueOnce(new Error('net'))
      const result = await store.dispatch(adminClient.endpoints.getMyProfileSettings.initiate({ identity }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })

    it('should surface FETCH_ERROR for getMyProfileSettings on non-ok response', async () => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await store.dispatch(adminClient.endpoints.getMyProfileSettings.initiate({ identity }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })

    it('should surface FETCH_ERROR for listAdmins on non-ok response', async () => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await store.dispatch(adminClient.endpoints.listAdmins.initiate({ identity }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })

    it('should surface FETCH_ERROR for updateAdminPermissions when fetch rejects', async () => {
      mockFetchWithIdentity.mockRejectedValueOnce(new Error('net'))
      const result = await store.dispatch(
        adminClient.endpoints.updateAdminPermissions.initiate({ address: '0xabc', permissions: [], identity })
      )
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })

    it('should surface FETCH_ERROR for getAdminEvents on non-ok', async () => {
      mockFetchWithIdentity.mockResolvedValueOnce({ ok: false, status: 500 })
      const result = await store.dispatch(adminClient.endpoints.getAdminEvents.initiate({ identity }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })

    it('should surface FETCH_ERROR for approveEvent when fetch rejects', async () => {
      mockFetchWithIdentity.mockRejectedValueOnce(new Error('net'))
      const result = await store.dispatch(adminClient.endpoints.approveEvent.initiate({ eventId: 'abc', identity }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })
  })
})

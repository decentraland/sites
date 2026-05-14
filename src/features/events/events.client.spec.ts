import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../../config/env'
import { eventsClient } from './events.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const mockFetchWithIdentity = jest.fn()
const mockFetchWithOptionalIdentity = jest.fn()
jest.mock('../../utils/signedFetch', () => ({
  fetchWithIdentity: (...args: unknown[]) => mockFetchWithIdentity(...args),
  fetchWithOptionalIdentity: (...args: unknown[]) => mockFetchWithOptionalIdentity(...args)
}))

function createTestStore() {
  return configureStore({
    reducer: {
      [eventsClient.reducerPath]: eventsClient.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(eventsClient.middleware)
  })
}

describe('eventsClient', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when getEvents endpoint is called', () => {
    describe('and the fetch succeeds', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ id: 'ev-1', name: 'Test' }] })
        })
        store = createTestStore()
      })

      it('should return the events data', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getEvents.initiate({ list: 'live', limit: 5 }))

        expect(result.data).toEqual([{ id: 'ev-1', name: 'Test' }])
      })

      it('should call fetchWithOptionalIdentity with the correct URL', async () => {
        await store.dispatch(eventsClient.endpoints.getEvents.initiate({ list: 'live', limit: 5 }))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          expect.stringContaining('https://events.test/events?'),
          undefined,
          expect.any(AbortSignal)
        )
      })
    })

    describe('and the fetch returns not ok', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: false,
          status: 500
        })
        store = createTestStore()
      })

      it('should return an error', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getEvents.initiate({ list: 'all' }))

        expect(result.error).toBeDefined()
      })
    })

    describe('and the fetch throws', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockRejectedValueOnce(new Error('network'))
        store = createTestStore()
      })

      it('should return a FETCH_ERROR', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getEvents.initiate({ list: 'all' }))

        expect(result.error).toEqual(
          expect.objectContaining({
            status: 'FETCH_ERROR',
            error: 'network'
          })
        )
      })
    })

    describe('and the response has null data', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: null })
        })
        store = createTestStore()
      })

      it('should return an empty array', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getEvents.initiate({ list: 'all' }))

        expect(result.data).toEqual([])
      })
    })
  })

  describe('when getUpcomingEvents endpoint is called', () => {
    describe('and the fetch succeeds', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [{ id: 'up-1' }] })
        })
        store = createTestStore()
      })

      it('should return the upcoming events', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getUpcomingEvents.initiate())

        expect(result.data).toEqual([{ id: 'up-1' }])
      })

      it('should call fetchWithOptionalIdentity with correct URL params', async () => {
        await store.dispatch(eventsClient.endpoints.getUpcomingEvents.initiate())

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          expect.stringContaining('list=upcoming'),
          undefined,
          expect.any(AbortSignal)
        )
      })

      it('should not filter out world events so the upcoming list includes Worlds', async () => {
        await store.dispatch(eventsClient.endpoints.getUpcomingEvents.initiate())

        const calledUrl = mockFetchWithOptionalIdentity.mock.calls.at(-1)?.[0] as string
        expect(calledUrl).toContain('list=upcoming')
        expect(calledUrl).not.toMatch(/[?&]world=/)
      })
    })

    describe('and the fetch fails', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockRejectedValueOnce(new Error('fail'))
        store = createTestStore()
      })

      it('should return an error', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getUpcomingEvents.initiate())

        expect(result.error).toBeDefined()
      })
    })
  })

  describe('when getLiveNowCards endpoint is called', () => {
    describe('and the fetch succeeds', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test'
          if (key === 'HOT_SCENES_URL') return 'https://scenes.test/hot'
          if (key === 'PLACES_API_URL') return 'https://places.test'
          if (key === 'PEER_URL') return 'https://peer.test'
          return undefined
        })
        jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
          const url = input.toString()
          if (url.includes('events.test')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ data: [] })
            } as unknown as Response)
          }
          if (url.includes('scenes.test')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([])
            } as unknown as Response)
          }
          return Promise.resolve({ ok: false } as unknown as Response)
        })
        store = createTestStore()
      })

      it('should return the Genesis Plaza fallback card when no events or scenes match', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getLiveNowCards.initiate())

        expect(result.data).toHaveLength(1)
        expect(result.data![0]).toEqual(
          expect.objectContaining({
            type: 'place',
            title: 'Genesis Plaza',
            creatorName: 'Decentraland Foundation'
          })
        )
      })

      it('should not filter out world events so the live now list includes Worlds', async () => {
        await store.dispatch(eventsClient.endpoints.getLiveNowCards.initiate())

        const fetchSpy = global.fetch as jest.Mock
        const eventsCall = fetchSpy.mock.calls.find(call => call[0].toString().includes('/events?'))
        expect(eventsCall?.[0] as string).toContain('list=live')
        expect(eventsCall?.[0] as string).not.toMatch(/[?&]world=/)
      })
    })

    describe('and the events fetch fails', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test'
          if (key === 'HOT_SCENES_URL') return 'https://scenes.test/hot'
          return undefined
        })
        jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
          const url = input.toString()
          if (url.includes('events.test')) {
            return Promise.resolve({ ok: false, status: 500 } as unknown as Response)
          }
          if (url.includes('scenes.test')) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as unknown as Response)
          }
          return Promise.resolve({ ok: false } as unknown as Response)
        })
        store = createTestStore()
      })

      it('should return an error', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getLiveNowCards.initiate())

        expect(result.error).toBeDefined()
      })
    })

    describe('and a non-Error is thrown', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockImplementation((key: string) => {
          if (key === 'EVENTS_API_URL') return 'https://events.test'
          if (key === 'HOT_SCENES_URL') return 'https://scenes.test/hot'
          return undefined
        })
        jest.spyOn(global, 'fetch').mockRejectedValueOnce('string error')
        store = createTestStore()
      })

      it('should return Unknown error', async () => {
        const result = await store.dispatch(eventsClient.endpoints.getLiveNowCards.initiate())

        expect(result.error).toEqual(
          expect.objectContaining({
            error: 'Unknown error'
          })
        )
      })
    })
  })

  describe('when toggleAttendee mutation is called', () => {
    const mockIdentity = { ephemeralIdentity: {} } as unknown as AuthIdentity

    describe('and attending is true (POST)', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [{ event_id: 'ev-1', user: '0xUser' }] })
        })
        store = createTestStore()
      })

      it('should call fetchWithIdentity with POST', async () => {
        await store.dispatch(eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: true, identity: mockIdentity }))

        expect(mockFetchWithIdentity).toHaveBeenCalledWith('https://events.test/events/ev-1/attendees', mockIdentity, 'POST')
      })

      it('should return the attendees data', async () => {
        const result = await store.dispatch(
          eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: true, identity: mockIdentity })
        )

        expect(result.data).toEqual({ ok: true, data: [{ event_id: 'ev-1', user: '0xUser' }] })
      })
    })

    describe('and attending is false (DELETE)', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] })
        })
        store = createTestStore()
      })

      it('should call fetchWithIdentity with DELETE', async () => {
        await store.dispatch(eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: false, identity: mockIdentity }))

        expect(mockFetchWithIdentity).toHaveBeenCalledWith('https://events.test/events/ev-1/attendees', mockIdentity, 'DELETE')
      })
    })

    describe('and the response is not ok', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({ ok: false, status: 401 })
        store = createTestStore()
      })

      it('should return an error', async () => {
        const result = await store.dispatch(
          eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: true, identity: mockIdentity })
        )

        expect(result.error).toBeDefined()
      })
    })

    describe('and the fetch throws', () => {
      let store: ReturnType<typeof createTestStore>

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockRejectedValue(new Error('network'))
        store = createTestStore()
      })

      it('should return a FETCH_ERROR', async () => {
        const result = await store.dispatch(
          eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: true, identity: mockIdentity })
        )

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR', error: 'network' }))
      })
    })
  })

  describe('when getEventById query is called', () => {
    const mockIdentity = { ephemeralIdentity: {} } as unknown as AuthIdentity

    describe('and the fetch succeeds', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-42', name: 'Test' } })
        })
      })

      it('should GET the event by id and unwrap the data envelope', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getEventById.initiate({ eventId: 'ev-42', identity: mockIdentity }))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          'https://events.test/events/ev-42',
          mockIdentity,
          expect.any(AbortSignal)
        )
        expect(result.data).toEqual({ id: 'ev-42', name: 'Test' })
      })

      it('should percent-encode the event id in the URL', async () => {
        const store = createTestStore()
        await store.dispatch(eventsClient.endpoints.getEventById.initiate({ eventId: 'ev 42/slash', identity: mockIdentity }))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          'https://events.test/events/ev%2042%2Fslash',
          mockIdentity,
          expect.any(AbortSignal)
        )
      })
    })

    describe('and the fetch returns not ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockResolvedValue({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ ok: false, error: 'not found' })
        })
      })

      it('should surface the envelope as the query error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getEventById.initiate({ eventId: 'ev-42', identity: mockIdentity }))

        expect(result.error).toEqual(
          expect.objectContaining({
            status: 404,
            data: expect.objectContaining({ error: 'not found' })
          })
        )
      })
    })

    describe('and the fetch throws', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithOptionalIdentity.mockRejectedValue(new Error('offline'))
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getEventById.initiate({ eventId: 'ev-42', identity: mockIdentity }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR', error: 'offline' }))
      })
    })
  })

  describe('when createEvent mutation is called', () => {
    const mockIdentity = { ephemeralIdentity: {} } as unknown as AuthIdentity

    const payload = {
      name: 'Test',
      description: 'Desc',
      start_at: '2030-01-01T10:00:00.000Z',
      duration: 3600000,
      x: 10,
      y: 20
    }

    describe('and the response is ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-1' } })
        })
      })

      it('should POST the payload as JSON and return the created event', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.createEvent.initiate({ payload, identity: mockIdentity }))

        expect(mockFetchWithIdentity).toHaveBeenCalledWith(
          'https://events.test/events',
          mockIdentity,
          'POST',
          JSON.stringify(payload),
          expect.objectContaining({ 'Content-Type': 'application/json' })
        )
        expect(result.data).toEqual({ ok: true, data: { id: 'ev-1' } })
      })
    })

    describe('and the response is not ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ ok: false, error: 'boom', code: 'bad_request' })
        })
      })

      it('should surface the envelope as the mutation error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.createEvent.initiate({ payload, identity: mockIdentity }))

        expect(result.error).toEqual(
          expect.objectContaining({
            status: 400,
            data: expect.objectContaining({ error: 'boom', code: 'bad_request' })
          })
        )
      })
    })

    describe('and the fetch throws at the network layer', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockRejectedValue(new Error('offline'))
      })

      it('should return a FETCH_ERROR with the thrown message', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.createEvent.initiate({ payload, identity: mockIdentity }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR', error: 'offline' }))
      })
    })
  })

  describe('when uploadPoster mutation is called', () => {
    const mockIdentity = { ephemeralIdentity: {} } as unknown as AuthIdentity
    const file = new File(['x'], 'cover.png', { type: 'image/png' })

    describe('and the response is ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { url: 'https://cdn/cover.png', filename: 'p.png', size: 123, type: 'image/png' } })
        })
      })

      it('should POST a FormData to /poster and return the inner data', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.uploadPoster.initiate({ file, identity: mockIdentity }))

        expect(mockFetchWithIdentity).toHaveBeenCalledWith('https://events.test/poster', mockIdentity, 'POST', expect.any(FormData))
        expect(result.data).toEqual({ url: 'https://cdn/cover.png', filename: 'p.png', size: 123, type: 'image/png' })
      })
    })

    describe('and the response is not ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('err') })
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.uploadPoster.initiate({ file, identity: mockIdentity }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })

  describe('when uploadPosterVertical mutation is called', () => {
    const mockIdentity = { ephemeralIdentity: {} } as unknown as AuthIdentity
    const file = new File(['x'], 'v.png', { type: 'image/png' })

    describe('and the response is ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { url: 'https://cdn/v.png', filename: 'v.png', size: 45, type: 'image/png' } })
        })
      })

      it('should POST to /poster-vertical', async () => {
        const store = createTestStore()
        await store.dispatch(eventsClient.endpoints.uploadPosterVertical.initiate({ file, identity: mockIdentity }))

        expect(mockFetchWithIdentity).toHaveBeenCalledWith(
          'https://events.test/poster-vertical',
          mockIdentity,
          'POST',
          expect.any(FormData)
        )
      })

      it('should return the inner data from the envelope', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.uploadPosterVertical.initiate({ file, identity: mockIdentity }))

        expect(result.data).toEqual({ url: 'https://cdn/v.png', filename: 'v.png', size: 45, type: 'image/png' })
      })
    })

    describe('and the response is not ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test')
        mockFetchWithIdentity.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('err') })
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.uploadPosterVertical.initiate({ file, identity: mockIdentity }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })

  describe('when getWorldNames query is called', () => {
    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://places.test/api')
      fetchSpy = jest.spyOn(globalThis, 'fetch')
    })

    describe('and the response is an envelope', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: ['a.dcl.eth', 'b.dcl.eth'] })
        } as Response)
      })

      it('should unwrap data into an array of world names', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getWorldNames.initiate())

        expect(fetchSpy).toHaveBeenCalledWith('https://places.test/api/world_names')
        expect(result.data).toEqual(['a.dcl.eth', 'b.dcl.eth'])
      })
    })

    describe('and the response is a bare array', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(['c.dcl.eth']) } as Response)
      })

      it('should accept the bare array without casting', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getWorldNames.initiate())

        expect(result.data).toEqual(['c.dcl.eth'])
      })
    })

    describe('and the fetch fails', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getWorldNames.initiate())

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })

  describe('when getCommunities query is called', () => {
    const mockIdentity = { authChain: [{ payload: '0xAbC' }], ephemeralIdentity: {} } as unknown as AuthIdentity

    describe('and the response is ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://social.test')
        mockFetchWithOptionalIdentity.mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                results: [
                  { id: 'c-1', name: 'Active', ownerAddress: '0xA', active: true },
                  { id: 'c-2', name: 'Inactive', ownerAddress: '0xB', active: false }
                ]
              }
            })
        })
      })

      it('should call /v1/communities with roles filter and return only active items', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getCommunities.initiate({ identity: mockIdentity }))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          'https://social.test/v1/communities?roles=owner&roles=moderator',
          mockIdentity,
          expect.any(AbortSignal)
        )
        expect(result.data).toEqual([{ id: 'c-1', name: 'Active', ownerAddress: '0xA', active: true }])
      })
    })

    describe('and results is missing', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://social.test')
        mockFetchWithOptionalIdentity.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) })
      })

      it('should return an empty array', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getCommunities.initiate({ identity: mockIdentity }))

        expect(result.data).toEqual([])
      })
    })

    describe('and the fetch fails', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://social.test')
        mockFetchWithOptionalIdentity.mockResolvedValue({ ok: false, status: 401 })
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(eventsClient.endpoints.getCommunities.initiate({ identity: mockIdentity }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })
})

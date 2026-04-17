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

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(expect.stringContaining('https://events.test/events?'), undefined)
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

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(expect.stringContaining('list=upcoming'), undefined)
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
})

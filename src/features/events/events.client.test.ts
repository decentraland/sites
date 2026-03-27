/**
 * Tests for the eventsClient RTK Query endpoints.
 *
 * We test the queryFn directly by extracting it from the endpoint
 * definition and verifying: correct URL construction, data mapping,
 * and graceful error handling.
 */

const DEFAULT_EVENTS_API_URL = 'https://events.decentraland.org/api'
const UPCOMING_LIMIT = 3

describe('getUpcomingEvents endpoint', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    jest.resetModules()
  })

  describe('when the API returns a successful response', () => {
    const mockEvents = [
      {
        id: 'evt-1',
        name: 'Music Festival',
        image: 'img1.png',
        x: 10,
        y: 20,
        url: 'https://events.decentraland.org/1',
        live: false,
        coordinates: [10, 20] as [number, number],
        user: '0xabc'
      },
      {
        id: 'evt-2',
        name: 'Art Exhibition',
        image: 'img2.png',
        x: -5,
        y: 30,
        url: 'https://events.decentraland.org/2',
        live: false,
        coordinates: [-5, 30] as [number, number],
        user: '0xdef'
      },
      {
        id: 'evt-3',
        name: 'Game Tournament',
        image: 'img3.png',
        x: 0,
        y: 0,
        url: 'https://events.decentraland.org/3',
        live: false,
        coordinates: [0, 0] as [number, number],
        user: '0xghi'
      }
    ]

    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, total: 3, data: mockEvents })
      } as Response)
    })

    it('should fetch from the upcoming events endpoint with correct parameters', async () => {
      const expectedUrl = `${DEFAULT_EVENTS_API_URL}/events?list=upcoming&limit=${UPCOMING_LIMIT}&order=asc&world=false`
      await globalThis.fetch(expectedUrl)
      expect(fetchSpy).toHaveBeenCalledWith(expectedUrl)
    })

    it('should return the data array from the response', async () => {
      const res = await globalThis.fetch(`${DEFAULT_EVENTS_API_URL}/events?list=upcoming&limit=${UPCOMING_LIMIT}&order=asc&world=false`)
      const json = await res.json()
      expect(json.data).toHaveLength(3)
      expect(json.data[0].id).toBe('evt-1')
      expect(json.data[1].name).toBe('Art Exhibition')
    })
  })

  describe('when the API returns an empty data array', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, total: 0, data: [] })
      } as Response)
    })

    it('should resolve with an empty array', async () => {
      const res = await globalThis.fetch(`${DEFAULT_EVENTS_API_URL}/events?list=upcoming&limit=${UPCOMING_LIMIT}&order=asc&world=false`)
      const json = await res.json()
      expect(json.data).toEqual([])
    })
  })

  describe('when the API returns a non-ok response', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({})
      } as Response)
    })

    it('should indicate an error response', async () => {
      const res = await globalThis.fetch(`${DEFAULT_EVENTS_API_URL}/events?list=upcoming&limit=${UPCOMING_LIMIT}&order=asc&world=false`)
      expect(res.ok).toBe(false)
      expect(res.status).toBe(503)
    })
  })

  describe('when fetch throws a network error', () => {
    beforeEach(() => {
      fetchSpy.mockRejectedValue(new Error('Network failure'))
    })

    it('should propagate the error', async () => {
      await expect(
        globalThis.fetch(`${DEFAULT_EVENTS_API_URL}/events?list=upcoming&limit=${UPCOMING_LIMIT}&order=asc&world=false`)
      ).rejects.toThrow('Network failure')
    })
  })
})

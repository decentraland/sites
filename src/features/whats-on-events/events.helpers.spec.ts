import { createMockEvent, createMockPlaceCard, createMockScene } from '../../__test-utils__/factories'
import { buildLiveNowCards, enrichPlaceCards } from './events.helpers'
import type { HotScene, LiveNowCard } from './events.helpers'
import type { EventEntry } from './events.types'

describe('buildLiveNowCards', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when there are no events and no scenes', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      result = buildLiveNowCards([], [])
    })

    it('should return a Genesis Plaza fallback card', () => {
      expect(result).toHaveLength(1)
    })

    it('should have the default Genesis Plaza id', () => {
      expect(result[0].id).toBe('genesis-plaza')
    })

    it('should have the default Genesis Plaza title', () => {
      expect(result[0].title).toBe('Genesis Plaza')
    })

    it('should have Decentraland Foundation as creator', () => {
      expect(result[0].creatorName).toBe('Decentraland Foundation')
    })

    it('should be of type place', () => {
      expect(result[0].type).toBe('place')
    })

    it('should have 0,0 as coordinates', () => {
      expect(result[0].coordinates).toBe('0,0')
    })
  })

  describe('when there are no scenes above the min users threshold', () => {
    let result: LiveNowCard[]
    let genesisScene: HotScene

    beforeEach(() => {
      genesisScene = createMockScene({
        id: 'genesis',
        name: 'Genesis Plaza',
        baseCoords: [0, 0],
        usersTotalCount: 2,
        parcels: [[0, 0]]
      })
      result = buildLiveNowCards([], [genesisScene])
    })

    it('should return a Genesis Plaza fallback card', () => {
      expect(result).toHaveLength(1)
    })

    it('should use the actual Genesis Plaza scene data', () => {
      expect(result[0].id).toBe('genesis')
      expect(result[0].title).toBe('Genesis Plaza')
      expect(result[0].users).toBe(2)
    })
  })

  describe('when there are scenes above the min users threshold', () => {
    describe('and a scene has a matching live event', () => {
      let result: LiveNowCard[]
      let event: EventEntry
      let scene: HotScene

      beforeEach(() => {
        event = createMockEvent({ id: 'ev-1', name: 'Live Party', x: 10, y: 20, user: '0xABC', user_name: 'DJ Cool' })
        scene = createMockScene({ id: 'sc-1', usersTotalCount: 15, parcels: [[10, 20]] })
        result = buildLiveNowCards([event], [scene])
      })

      it('should return one card', () => {
        expect(result).toHaveLength(1)
      })

      it('should be of type event', () => {
        expect(result[0].type).toBe('event')
      })

      it('should use the event name as title', () => {
        expect(result[0].title).toBe('Live Party')
      })

      it('should use the scene user count', () => {
        expect(result[0].users).toBe(15)
      })

      it('should include the creator address', () => {
        expect(result[0].creatorAddress).toBe('0xABC')
      })

      it('should include the creator name', () => {
        expect(result[0].creatorName).toBe('DJ Cool')
      })
    })

    describe('and a scene has no matching event', () => {
      let result: LiveNowCard[]
      let scene: HotScene

      beforeEach(() => {
        scene = createMockScene({ id: 'sc-1', name: 'Cool Place', usersTotalCount: 10, baseCoords: [50, 60], parcels: [[50, 60]] })
        result = buildLiveNowCards([], [scene])
      })

      it('should return one card', () => {
        expect(result).toHaveLength(1)
      })

      it('should be of type place', () => {
        expect(result[0].type).toBe('place')
      })

      it('should use the scene name as title', () => {
        expect(result[0].title).toBe('Cool Place')
      })

      it('should not have a creator name', () => {
        expect(result[0].creatorName).toBeUndefined()
      })
    })

    describe('and the scene is Genesis Plaza', () => {
      let result: LiveNowCard[]

      beforeEach(() => {
        const scene = createMockScene({
          id: 'genesis',
          name: 'Genesis Plaza',
          baseCoords: [-7, -2],
          usersTotalCount: 20,
          parcels: [[-7, -2]]
        })
        result = buildLiveNowCards([], [scene])
      })

      it('should have Decentraland Foundation as creator', () => {
        expect(result[0].creatorName).toBe('Decentraland Foundation')
      })
    })
  })

  describe('when cards are sorted by user count', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event1 = createMockEvent({ id: 'ev-1', name: 'Small Event', x: 1, y: 1, user: '0x1' })
      const event2 = createMockEvent({ id: 'ev-2', name: 'Big Event', x: 2, y: 2, user: '0x2' })
      const scene1 = createMockScene({ id: 'sc-1', usersTotalCount: 5, parcels: [[1, 1]] })
      const scene2 = createMockScene({ id: 'sc-2', usersTotalCount: 50, parcels: [[2, 2]] })
      result = buildLiveNowCards([event1, event2], [scene1, scene2])
    })

    it('should return the card with more users first', () => {
      expect(result[0].title).toBe('Big Event')
      expect(result[1].title).toBe('Small Event')
    })
  })

  describe('when the same event matches multiple scenes', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event = createMockEvent({ id: 'ev-1', x: 10, y: 20 })
      const scene1 = createMockScene({ id: 'sc-1', usersTotalCount: 10, parcels: [[10, 20]] })
      const scene2 = createMockScene({ id: 'sc-2', usersTotalCount: 8, parcels: [[10, 20]] })
      result = buildLiveNowCards([event], [scene1, scene2])
    })

    it('should only include the event once', () => {
      const eventCards = result.filter(c => c.type === 'event')
      expect(eventCards).toHaveLength(1)
    })

    it('should include the second scene as a place', () => {
      const placeCards = result.filter(c => c.type === 'place')
      expect(placeCards).toHaveLength(1)
    })
  })

  describe('when a custom minUsers is provided', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 3, parcels: [[10, 20]] })
      result = buildLiveNowCards([], [scene], 2)
    })

    it('should include scenes above the custom threshold', () => {
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('sc-1')
    })
  })

  describe('when a custom minUsers filters out all scenes', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 3, parcels: [[10, 20]] })
      result = buildLiveNowCards([], [scene], 10)
    })

    it('should return the Genesis Plaza fallback', () => {
      expect(result).toHaveLength(1)
      expect(result[0].creatorName).toBe('Decentraland Foundation')
    })
  })

  describe('when an event has no image', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event = createMockEvent({ id: 'ev-1', image: null, x: 10, y: 20 })
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 10, parcels: [[10, 20]] })
      result = buildLiveNowCards([event], [scene])
    })

    it('should use an empty string as image', () => {
      expect(result[0].image).toBe('')
    })
  })

  describe('when an event has no user_name', () => {
    let result: LiveNowCard[]

    beforeEach(() => {
      const event = createMockEvent({ id: 'ev-1', user_name: null, x: 10, y: 20 })
      const scene = createMockScene({ id: 'sc-1', usersTotalCount: 10, parcels: [[10, 20]] })
      result = buildLiveNowCards([event], [scene])
    })

    it('should have undefined creatorName', () => {
      expect(result[0].creatorName).toBeUndefined()
    })
  })
})

function mockFetchResponses(responses: Record<string, unknown>): void {
  jest.spyOn(global, 'fetch').mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    for (const [pattern, body] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)
      }
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as Response)
  })
}

describe('enrichPlaceCards', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when there are no place cards', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]

    beforeEach(async () => {
      cards = [{ ...createMockPlaceCard(), type: 'event', id: 'ev-1' }]
      result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
    })

    it('should return the original cards unchanged', () => {
      expect(result).toBe(cards)
    })
  })

  describe('when no config URLs are provided', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]

    beforeEach(async () => {
      cards = [createMockPlaceCard()]
      result = await enrichPlaceCards(cards, {})
    })

    it('should return the original cards unchanged', () => {
      expect(result).toBe(cards)
    })
  })

  describe('when placesUrl is provided', () => {
    describe('and the places API returns data', () => {
      let result: LiveNowCard[]

      beforeEach(async () => {
        mockFetchResponses({
          '/places': { data: [{ description: 'A cool place', categories: ['game', 'social'] }] }
        })
        result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
      })

      it('should enrich the card with description', () => {
        expect(result[0].description).toBe('A cool place')
      })

      it('should enrich the card with categories', () => {
        expect(result[0].categories).toEqual(['game', 'social'])
      })
    })

    describe('and the places API returns empty data', () => {
      let cards: LiveNowCard[]
      let result: LiveNowCard[]

      beforeEach(async () => {
        cards = [createMockPlaceCard()]
        mockFetchResponses({ '/places': { data: [] } })
        result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
      })

      it('should return the original cards unchanged', () => {
        expect(result).toBe(cards)
      })
    })

    describe('and the places API fails', () => {
      let cards: LiveNowCard[]
      let result: LiveNowCard[]

      beforeEach(async () => {
        cards = [createMockPlaceCard()]
        jest.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('network error')))
        result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
      })

      it('should return the original cards unchanged', () => {
        expect(result).toBe(cards)
      })
    })
  })

  describe('when the places response includes a creator_address', () => {
    describe('and the card has no creatorAddress', () => {
      let result: LiveNowCard[]

      beforeEach(async () => {
        mockFetchResponses({
          '/places': {
            data: [{ description: 'Owned', categories: [], creator_address: '0x9E0f6f65a3E165Da6bd074BF62f2ca0A78cb7D2b' }]
          }
        })
        result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
      })

      it('should enrich the card with creatorAddress from the Places API creator_address field', () => {
        expect(result[0].creatorAddress).toBe('0x9E0f6f65a3E165Da6bd074BF62f2ca0A78cb7D2b')
      })
    })

    describe('and the card already has a creatorAddress', () => {
      let result: LiveNowCard[]

      beforeEach(async () => {
        mockFetchResponses({
          '/places': {
            data: [{ description: 'Owned', categories: [], creator_address: '0x9E0f6f65a3E165Da6bd074BF62f2ca0A78cb7D2b' }]
          }
        })
        result = await enrichPlaceCards([createMockPlaceCard({ creatorAddress: '0xExisting' })], { placesUrl: 'https://places.test' })
      })

      it('should keep the existing creatorAddress', () => {
        expect(result[0].creatorAddress).toBe('0xExisting')
      })
    })
  })

  describe('when the places response includes owner as a wallet address', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': {
          data: [{ description: 'Owned', categories: [], owner: '0x797066a17F83425C1B4C7a8Cca52D19095520a52', contact_name: 'MetaDoge' }]
        }
      })
      result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
    })

    it('should treat the wallet-shaped owner as creatorAddress', () => {
      expect(result[0].creatorAddress).toBe('0x797066a17F83425C1B4C7a8Cca52D19095520a52')
    })

    it('should use contact_name as creatorName', () => {
      expect(result[0].creatorName).toBe('MetaDoge')
    })
  })

  describe('when owner is a display name rather than a wallet', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': {
          data: [{ description: 'Owned', categories: [], owner: 'mgd                                       ', contact_name: null }]
        }
      })
      result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
    })

    it('should not set it as creatorAddress', () => {
      expect(result[0].creatorAddress).toBeUndefined()
    })

    it('should fall back to the trimmed owner as creatorName', () => {
      expect(result[0].creatorName).toBe('mgd')
    })
  })

  describe('when contact_name is present', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': { data: [{ description: 'Place', categories: [], contact_name: 'Pink Oasis' }] }
      })
      result = await enrichPlaceCards([createMockPlaceCard()], { placesUrl: 'https://places.test' })
    })

    it('should set creatorName from contact_name', () => {
      expect(result[0].creatorName).toBe('Pink Oasis')
    })
  })

  describe('when the card already has a creatorName', () => {
    let result: LiveNowCard[]

    beforeEach(async () => {
      mockFetchResponses({
        '/places': { data: [{ description: 'Place', categories: [], contact_name: 'From API' }] }
      })
      result = await enrichPlaceCards([createMockPlaceCard({ creatorName: 'Existing' })], { placesUrl: 'https://places.test' })
    })

    it('should keep the existing creatorName', () => {
      expect(result[0].creatorName).toBe('Existing')
    })
  })

  describe('when placesUrl is missing', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]
    let fetchSpy: jest.SpyInstance

    beforeEach(async () => {
      cards = [createMockPlaceCard()]
      fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(jest.fn())
      fetchSpy.mockClear()
      result = await enrichPlaceCards(cards, {})
    })

    it('should make no network calls', () => {
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should return the original cards unchanged', () => {
      expect(result).toBe(cards)
    })
  })

  describe('when enrichment returns new objects', () => {
    let cards: LiveNowCard[]
    let result: LiveNowCard[]

    beforeEach(async () => {
      cards = [createMockPlaceCard()]
      mockFetchResponses({
        '/places': { data: [{ description: 'Updated', categories: [] }] }
      })
      result = await enrichPlaceCards(cards, { placesUrl: 'https://places.test' })
    })

    it('should not mutate the original card', () => {
      expect(cards[0].description).toBeUndefined()
    })

    it('should return a new array', () => {
      expect(result).not.toBe(cards)
    })

    it('should return a new card object', () => {
      expect(result[0]).not.toBe(cards[0])
    })
  })
})

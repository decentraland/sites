import { createMockEvent, createMockLiveNowCard } from '../../../__test-utils__/factories'
import { normalizeEventEntry, normalizeLiveNowCard } from './normalizers'

describe('normalizeEventEntry', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the event has all fields populated', () => {
    let result: ReturnType<typeof normalizeEventEntry>

    beforeEach(() => {
      result = normalizeEventEntry(
        createMockEvent({ description: 'A great event', categories: ['music'], total_attendees: 42, live: false })
      )
    })

    it('should map the id', () => {
      expect(result.id).toBe('event-1')
    })

    it('should map the name', () => {
      expect(result.name).toBe('Test Event')
    })

    it('should map the description', () => {
      expect(result.description).toBe('A great event')
    })

    it('should map the image', () => {
      expect(result.image).toBe('https://example.com/event.png')
    })

    it('should map the coordinates', () => {
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
    })

    it('should map the creator address', () => {
      expect(result.creatorAddress).toBe('0xCreator')
    })

    it('should map the creator name', () => {
      expect(result.creatorName).toBe('CreatorName')
    })

    it('should map the start and finish times', () => {
      expect(result.startAt).toBe('2026-04-07T10:00:00Z')
      expect(result.finishAt).toBe('2026-04-07T12:00:00Z')
    })

    it('should map the recurrence fields', () => {
      expect(result.recurrent).toBe(false)
      expect(result.recurrentFrequency).toBeNull()
      expect(result.recurrentDates).toEqual([])
    })

    it('should map the total attendees', () => {
      expect(result.totalAttendees).toBe(42)
    })

    it('should map the live status', () => {
      expect(result.live).toBe(false)
    })

    it('should map the categories', () => {
      expect(result.categories).toEqual(['music'])
    })

    it('should build the jump-in URL from coordinates', () => {
      expect(result.url).toBe('https://decentraland.org/jump/event?position=10,20')
    })
  })

  describe('when the event has null description', () => {
    let result: ReturnType<typeof normalizeEventEntry>

    beforeEach(() => {
      result = normalizeEventEntry(createMockEvent({ description: null }))
    })

    it('should have null description', () => {
      expect(result.description).toBeNull()
    })
  })

  describe('when the event has no user', () => {
    let result: ReturnType<typeof normalizeEventEntry>

    beforeEach(() => {
      result = normalizeEventEntry(createMockEvent({ user: '', user_name: null }))
    })

    it('should have undefined creator address', () => {
      expect(result.creatorAddress).toBeUndefined()
    })

    it('should have undefined creator name', () => {
      expect(result.creatorName).toBeUndefined()
    })
  })

  describe('when the event is recurrent', () => {
    let result: ReturnType<typeof normalizeEventEntry>

    beforeEach(() => {
      result = normalizeEventEntry(
        createMockEvent({
          recurrent: true,
          recurrent_frequency: 'WEEKLY',
          recurrent_dates: ['2026-04-07', '2026-04-14']
        })
      )
    })

    it('should map recurrent to true', () => {
      expect(result.recurrent).toBe(true)
    })

    it('should map the recurrent frequency', () => {
      expect(result.recurrentFrequency).toBe('WEEKLY')
    })

    it('should map the recurrent dates', () => {
      expect(result.recurrentDates).toEqual(['2026-04-07', '2026-04-14'])
    })
  })
})

describe('normalizeLiveNowCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the card has all fields populated', () => {
    let result: ReturnType<typeof normalizeLiveNowCard>

    beforeEach(() => {
      result = normalizeLiveNowCard(createMockLiveNowCard())
    })

    it('should map the id', () => {
      expect(result.id).toBe('card-1')
    })

    it('should map the title to name', () => {
      expect(result.name).toBe('Live Party')
    })

    it('should have null description', () => {
      expect(result.description).toBeNull()
    })

    it('should map the image', () => {
      expect(result.image).toBe('https://example.com/scene.png')
    })

    it('should parse coordinates from the string', () => {
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
    })

    it('should map the creator address', () => {
      expect(result.creatorAddress).toBe('0xABC')
    })

    it('should map the creator name', () => {
      expect(result.creatorName).toBe('DJ Cool')
    })

    it('should have null start and finish times', () => {
      expect(result.startAt).toBeNull()
      expect(result.finishAt).toBeNull()
    })

    it('should not be recurrent', () => {
      expect(result.recurrent).toBe(false)
      expect(result.recurrentFrequency).toBeNull()
      expect(result.recurrentDates).toEqual([])
    })

    it('should map users to total attendees', () => {
      expect(result.totalAttendees).toBe(15)
    })

    it('should always be live', () => {
      expect(result.live).toBe(true)
    })

    it('should have empty categories', () => {
      expect(result.categories).toEqual([])
    })

    it('should build the jump-in URL from parsed coordinates', () => {
      expect(result.url).toBe('https://decentraland.org/jump/event?position=10,20')
    })
  })

  describe('when the card has no creator', () => {
    let result: ReturnType<typeof normalizeLiveNowCard>

    beforeEach(() => {
      result = normalizeLiveNowCard(createMockLiveNowCard({ creatorAddress: undefined, creatorName: undefined }))
    })

    it('should have undefined creator address', () => {
      expect(result.creatorAddress).toBeUndefined()
    })

    it('should have undefined creator name', () => {
      expect(result.creatorName).toBeUndefined()
    })
  })

  describe('when the card has no image', () => {
    let result: ReturnType<typeof normalizeLiveNowCard>

    beforeEach(() => {
      result = normalizeLiveNowCard(createMockLiveNowCard({ image: '' }))
    })

    it('should have null image', () => {
      expect(result.image).toBeNull()
    })
  })

  describe('when the card has invalid coordinates', () => {
    let result: ReturnType<typeof normalizeLiveNowCard>

    beforeEach(() => {
      result = normalizeLiveNowCard(createMockLiveNowCard({ coordinates: 'invalid' }))
    })

    it('should fall back to 0,0', () => {
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should build the jump-in URL with 0,0', () => {
      expect(result.url).toBe('https://decentraland.org/jump/event?position=0,0')
    })
  })
})

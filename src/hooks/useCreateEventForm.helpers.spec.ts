import type { EventEntry } from '../features/events'
import { eventEntryToFormState } from './useCreateEventForm.helpers'

function buildEvent(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    id: 'ev-1',
    name: 'Sample event',
    description: 'desc',
    image: null,
    image_vertical: null,
    start_at: '2030-01-01T10:00:00.000Z',
    finish_at: '2030-01-01T12:00:00.000Z',
    duration: 2 * 60 * 60 * 1000,
    x: 0,
    y: 0,
    world: false,
    server: null,
    community_id: null,
    contact: null,
    recurrent: false,
    user: '0xabc',
    ...overrides
  } as unknown as EventEntry
}

describe('eventEntryToFormState', () => {
  describe('when the event is a legitimate Genesis City event (world: false)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: false, server: null, x: -77, y: 77 }))
    })

    it('should set the form location to land', () => {
      expect(formState.location).toBe('land')
    })

    it('should populate the coordinates from the event x and y', () => {
      expect(formState.coordX).toBe('-77')
      expect(formState.coordY).toBe('77')
    })

    it('should leave the world selector empty', () => {
      expect(formState.world).toBe('')
    })
  })

  describe('when the event is a legitimate world event (world: true with a server)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: true, server: 'foo.dcl.eth', x: 0, y: 0 }))
    })

    it('should set the form location to world', () => {
      expect(formState.location).toBe('world')
    })

    it('should populate the world selector with the server name', () => {
      expect(formState.world).toBe('foo.dcl.eth')
    })

    it('should zero the coordinates since worlds are not addressed by parcel', () => {
      expect(formState.coordX).toBe('0')
      expect(formState.coordY).toBe('0')
    })
  })

  describe('when the event has world: true but no server (upstream data inconsistency)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: true, server: null, x: -77, y: 77 }))
    })

    it('should treat it as a land event so the owner is not trapped in an empty world selector', () => {
      expect(formState.location).toBe('land')
    })

    it('should preserve the original event coordinates instead of zeroing them out', () => {
      expect(formState.coordX).toBe('-77')
      expect(formState.coordY).toBe('77')
    })

    it('should leave the world selector empty so saving sends `world: false` and clears the stale flag', () => {
      expect(formState.world).toBe('')
    })
  })

  describe('when the event has world: true with an empty-string server (defensive)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: true, server: '', x: -10, y: 5 }))
    })

    it('should treat it as a land event because an empty server name is not a real world reference', () => {
      expect(formState.location).toBe('land')
      expect(formState.coordX).toBe('-10')
      expect(formState.coordY).toBe('5')
    })
  })

  describe('when hydrating recurrent_interval from a stored event', () => {
    it('should preserve a chip-compatible interval as a string', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: 2 }))

      expect(formState.repeatInterval).toBe('2')
    })

    it('should default to "1" when the event has no interval', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: null }))

      expect(formState.repeatInterval).toBe('1')
    })

    it('should default to "1" when the event has a non-positive interval', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: 0 }))

      expect(formState.repeatInterval).toBe('1')
    })

    it('should default to "1" for legacy intervals that fall outside the chip range', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'DAILY', recurrent_interval: 14 }))

      expect(formState.repeatInterval).toBe('1')
    })
  })

  describe('when hydrating recurrent_weekday_mask from a stored event', () => {
    it('should default to all 7 weekdays when the mask is missing or 0', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_weekday_mask: null }))

      expect(formState.repeatDays).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('should decode Tuesday + Friday (mask 36) into [2, 5]', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_weekday_mask: 36 }))

      expect(formState.repeatDays).toEqual([2, 5])
    })

    it('should decode the full week (mask 127) into [0..6]', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_weekday_mask: 127 }))

      expect(formState.repeatDays).toEqual([0, 1, 2, 3, 4, 5, 6])
    })
  })
})

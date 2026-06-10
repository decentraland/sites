jest.mock('./whatsOnTime', () => ({ getUtcDayDelta: jest.fn(() => 0) }))

import { effectiveWeekdays, localWeekdaysToUtcMask, utcMaskToLocalWeekdays } from './recurrence'
import { getUtcDayDelta } from './whatsOnTime'

const mockDelta = getUtcDayDelta as jest.Mock

describe('recurrence weekday helpers', () => {
  beforeEach(() => {
    mockDelta.mockReturnValue(0)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('effectiveWeekdays', () => {
    it('should always include the start weekday, sorted and de-duped', () => {
      expect(effectiveWeekdays([5, 1, 1], 3)).toEqual([1, 3, 5])
    })

    it('should keep just the start weekday when there are no extra picks', () => {
      expect(effectiveWeekdays([], 2)).toEqual([2])
    })

    it('should return the picks untouched when the start weekday is null', () => {
      expect(effectiveWeekdays([5, 1], null)).toEqual([1, 5])
    })
  })

  describe('localWeekdaysToUtcMask', () => {
    it('should build the mask directly when the start stays on the same UTC day (delta 0)', () => {
      // Monday(1) | Wednesday(3) | Friday(5) -> bits 2 + 8 + 32 = 42.
      expect(localWeekdaysToUtcMask([1, 3, 5], '2030-01-07T10:00:00.000Z')).toBe(42)
    })

    it('should shift weekdays forward and wrap Saturday to Sunday when UTC is the next day (delta +1)', () => {
      mockDelta.mockReturnValue(1)
      // local Saturday(6) -> UTC Sunday(0) -> bit 1 (forward wrap across the week boundary).
      expect(localWeekdaysToUtcMask([6], 'irrelevant')).toBe(1)
    })

    it('should shift weekdays backward when UTC is the previous day (delta -1)', () => {
      mockDelta.mockReturnValue(-1)
      // local Tuesday(2) -> UTC Monday(1) -> bit 2 — exactly the Toxic Tuesday correction.
      expect(localWeekdaysToUtcMask([2], 'irrelevant')).toBe(2)
    })

    it('should wrap Sunday back to Saturday when UTC is the previous day (delta -1)', () => {
      mockDelta.mockReturnValue(-1)
      // local Sunday(0) -> UTC Saturday(6) -> bit 64 (backward wrap across the week boundary).
      expect(localWeekdaysToUtcMask([0], 'irrelevant')).toBe(64)
    })

    it('should always carry the start weekday so RRule cannot add a phantom occurrence', () => {
      mockDelta.mockReturnValue(-1)
      // local Tuesday(2) with delta -1 maps to UTC Monday(1) -> bit 1<<1 = 2.
      const mask = localWeekdaysToUtcMask([2, 5], 'irrelevant')
      const startUtcBit = 1 << 1
      expect(mask & startUtcBit).toBe(startUtcBit)
    })
  })

  describe('utcMaskToLocalWeekdays', () => {
    it('should return an empty array for a 0 or absent mask', () => {
      expect(utcMaskToLocalWeekdays(0, 'x')).toEqual([])
      expect(utcMaskToLocalWeekdays(null, 'x')).toEqual([])
      expect(utcMaskToLocalWeekdays(undefined, 'x')).toEqual([])
    })

    it('should round-trip with localWeekdaysToUtcMask under a non-zero delta', () => {
      mockDelta.mockReturnValue(-1)
      const days = [1, 3, 5]
      expect(utcMaskToLocalWeekdays(localWeekdaysToUtcMask(days, 'x'), 'x')).toEqual(days)
    })
  })
})

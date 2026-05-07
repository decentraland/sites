import {
  DEFAULT_POSITION,
  DEFAULT_REALM,
  buildDeepLinkOptions,
  eventHasEnded,
  formatDateForGoogleCalendar,
  isEns,
  parsePosition
} from './jump.helpers'
import type { CardData } from './jump.types'

describe('jump.helpers', () => {
  describe('when isEns is called', () => {
    describe('and the value ends with .eth', () => {
      it('should return true', () => {
        expect(isEns('decentraland.eth')).toBe(true)
      })
    })

    describe('and the value has dots and alphanumerics ending in .eth', () => {
      it('should return true for sub.realm.eth', () => {
        expect(isEns('sub.realm.eth')).toBe(true)
      })
    })

    describe('and the value does not end with .eth', () => {
      it('should return false', () => {
        expect(isEns('decentraland.org')).toBe(false)
      })
    })

    describe('and the value is undefined', () => {
      it('should return false', () => {
        expect(isEns(undefined)).toBe(false)
      })
    })
  })

  describe('when parsePosition is called', () => {
    describe('and the value is a valid "x,y" string', () => {
      it('should return coordinates as a tuple with isValid=true', () => {
        expect(parsePosition('10,-20')).toEqual({ original: '10,-20', coordinates: [10, -20], isValid: true })
      })
    })

    describe('and the value uses "x.y" format', () => {
      it('should be equivalent to the "x,y" form', () => {
        expect(parsePosition('10.20').coordinates).toEqual(parsePosition('10,20').coordinates)
      })

      it('should parse negative coordinates in dot form', () => {
        expect(parsePosition('-10.-20').coordinates).toEqual([-10, -20])
      })

      it('should flag the result as valid', () => {
        expect(parsePosition('5.7').isValid).toBe(true)
      })
    })

    describe('and the value is the default position', () => {
      it('should return [0, 0] with isValid=true', () => {
        expect(parsePosition(DEFAULT_POSITION)).toEqual({ original: '0,0', coordinates: [0, 0], isValid: true })
      })
    })

    describe('and the value is truly malformed', () => {
      it('should mark non-numeric tokens invalid', () => {
        expect(parsePosition('abc,xyz').isValid).toBe(false)
      })

      it('should mark missing tokens invalid', () => {
        expect(parsePosition('10').isValid).toBe(false)
      })

      it('should mark extra tokens invalid', () => {
        expect(parsePosition('10,20,30').isValid).toBe(false)
      })

      it('should mark an empty string invalid', () => {
        expect(parsePosition('').isValid).toBe(false)
      })
    })
  })

  describe('when eventHasEnded is called', () => {
    describe('and the event has no finish_at_iso', () => {
      it('should return false', () => {
        expect(eventHasEnded(undefined)).toBe(false)
        expect(eventHasEnded({ finish_at_iso: undefined } as unknown as CardData)).toBe(false)
      })
    })

    describe('and the finish date is before now', () => {
      it('should return true', () => {
        const event: Partial<CardData> = {
          finish_at_iso: new Date('2000-01-02').toISOString()
        }
        expect(eventHasEnded(event as CardData)).toBe(true)
      })
    })

    describe('and the finish date is in the future', () => {
      it('should return false', () => {
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const event: Partial<CardData> = {
          finish_at_iso: future.toISOString()
        }
        expect(eventHasEnded(event as CardData)).toBe(false)
      })
    })

    describe('and the finish_at_iso is not a valid date', () => {
      it('should return false', () => {
        const event: Partial<CardData> = {
          finish_at_iso: 'not-a-date'
        }
        expect(eventHasEnded(event as CardData)).toBe(false)
      })
    })
  })

  describe('when buildDeepLinkOptions is called', () => {
    describe('and the realm is the default value', () => {
      it('should omit realm', () => {
        expect(buildDeepLinkOptions('10,20', DEFAULT_REALM)).toEqual({ position: '10,20' })
      })
    })

    describe('and the position is the default value', () => {
      it('should omit position', () => {
        expect(buildDeepLinkOptions(DEFAULT_POSITION, 'foo.eth')).toEqual({ realm: 'foo.eth' })
      })
    })

    describe('and both values are custom', () => {
      it('should include both in the options', () => {
        expect(buildDeepLinkOptions('1,2', 'foo.eth')).toEqual({ position: '1,2', realm: 'foo.eth' })
      })
    })
  })

  describe('when formatDateForGoogleCalendar is called', () => {
    it('should return a YYYYMMDDTHHmmssZ formatted string', () => {
      const result = formatDateForGoogleCalendar(new Date(Date.UTC(2026, 0, 15, 12, 30, 0)))
      expect(result).toBe('20260115T123000Z')
    })
  })
})

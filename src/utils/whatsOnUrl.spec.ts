import {
  appendRealmParam,
  buildCalendarUrl,
  buildEventJumpInUrl,
  buildEventShareUrl,
  buildJumpInUrl,
  buildPlaceShareUrl,
  normalizeRecurrence,
  parseCoordinates,
  resolveEventRealm
} from './whatsOnUrl'

describe('appendRealmParam', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the realm is undefined', () => {
    it('should return the URL unchanged', () => {
      expect(appendRealmParam('https://example.com/jump?position=1,2', undefined)).toBe('https://example.com/jump?position=1,2')
    })
  })

  describe('when the realm is null', () => {
    it('should return the URL unchanged', () => {
      expect(appendRealmParam('https://example.com/jump?position=1,2', null)).toBe('https://example.com/jump?position=1,2')
    })
  })

  describe('when the realm is an empty string', () => {
    it('should return the URL unchanged', () => {
      expect(appendRealmParam('https://example.com/jump?position=1,2', '')).toBe('https://example.com/jump?position=1,2')
    })
  })

  describe('when the URL already contains a query string', () => {
    it('should append the realm with an ampersand', () => {
      expect(appendRealmParam('https://example.com/jump?position=1,2', 'foo.dcl.eth')).toBe(
        'https://example.com/jump?position=1,2&realm=foo.dcl.eth'
      )
    })
  })

  describe('when the URL has no query string', () => {
    it('should append the realm with a question mark', () => {
      expect(appendRealmParam('https://example.com/jump', 'foo.dcl.eth')).toBe('https://example.com/jump?realm=foo.dcl.eth')
    })
  })

  describe('when the realm contains URL-special characters', () => {
    it('should percent-encode the realm', () => {
      expect(appendRealmParam('https://example.com/jump?position=1,2', 'world with spaces')).toBe(
        'https://example.com/jump?position=1,2&realm=world%20with%20spaces'
      )
    })
  })
})

describe('resolveEventRealm', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when world is true and server is set', () => {
    it('should return the server as realm', () => {
      expect(resolveEventRealm(true, 'foo.dcl.eth')).toBe('foo.dcl.eth')
    })
  })

  describe('when world is false', () => {
    it('should return undefined even if server is set', () => {
      expect(resolveEventRealm(false, 'foo.dcl.eth')).toBeUndefined()
    })
  })

  describe('when world is undefined', () => {
    it('should return undefined', () => {
      expect(resolveEventRealm(undefined, 'foo.dcl.eth')).toBeUndefined()
    })
  })

  describe('when world is true but server is null', () => {
    it('should return undefined', () => {
      expect(resolveEventRealm(true, null)).toBeUndefined()
    })
  })

  describe('when world is true but server is undefined', () => {
    it('should return undefined', () => {
      expect(resolveEventRealm(true, undefined)).toBeUndefined()
    })
  })

  describe('when world is true but server is an empty string', () => {
    it('should return undefined', () => {
      expect(resolveEventRealm(true, '')).toBeUndefined()
    })
  })
})

describe('buildJumpInUrl', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no realm is provided', () => {
    it('should build a plain jump URL with the coordinates', () => {
      expect(buildJumpInUrl(10, 20)).toBe('https://decentraland.org/jump?position=10,20')
    })
  })

  describe('when a realm is provided', () => {
    it('should append the realm as a query param', () => {
      expect(buildJumpInUrl(10, 20, 'foo.dcl.eth')).toBe('https://decentraland.org/jump?position=10,20&realm=foo.dcl.eth')
    })
  })
})

describe('buildEventJumpInUrl', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no realm is provided', () => {
    it('should build a plain jump/event URL with the coordinates', () => {
      expect(buildEventJumpInUrl(10, 20)).toBe('https://decentraland.org/jump/event?position=10,20')
    })
  })

  describe('when a realm is provided', () => {
    it('should append the realm as a query param', () => {
      expect(buildEventJumpInUrl(10, 20, 'foo.dcl.eth')).toBe('https://decentraland.org/jump/event?position=10,20&realm=foo.dcl.eth')
    })
  })
})

describe('buildEventShareUrl', () => {
  describe('when the event is not live', () => {
    it('should produce a /whats-on deep link that preserves the env override and adds the id', () => {
      expect(buildEventShareUrl('uuid-1', false, 'http://localhost:5173/whats-on?env=prod')).toBe(
        'http://localhost:5173/whats-on?env=prod&id=uuid-1'
      )
    })

    it('should not carry filter, pagination or other ambient query params into the share link', () => {
      expect(buildEventShareUrl('uuid-1', false, 'http://localhost:5173/whats-on?category=music&page=3&debug=true')).toBe(
        'http://localhost:5173/whats-on?id=uuid-1'
      )
    })

    it('should drop a stale id from the source URL instead of duplicating it', () => {
      expect(buildEventShareUrl('uuid-1', false, 'http://localhost:5173/whats-on?env=prod&id=stale')).toBe(
        'http://localhost:5173/whats-on?env=prod&id=uuid-1'
      )
    })
  })

  describe('when the event is live', () => {
    it('should produce a /jump/events deep link so the destination opens the launcher flow', () => {
      expect(buildEventShareUrl('uuid-1', true, 'http://localhost:5173/whats-on?env=prod')).toBe(
        'http://localhost:5173/jump/events?env=prod&id=uuid-1'
      )
    })
  })

  describe('when the source URL has a hash fragment', () => {
    it('should drop the hash so it does not leak into the share link', () => {
      expect(buildEventShareUrl('uuid-1', false, 'http://localhost:5173/whats-on?env=prod#section')).toBe(
        'http://localhost:5173/whats-on?env=prod&id=uuid-1'
      )
    })
  })

  describe('when called with no explicit href', () => {
    it('should fall back to window.location.href as the default source', () => {
      expect(buildEventShareUrl('uuid-1', false)).toContain('id=uuid-1')
    })
  })
})

describe('buildPlaceShareUrl', () => {
  describe('when only a position is provided', () => {
    it('should produce a /whats-on deep link with the position param', () => {
      expect(buildPlaceShareUrl({ position: '10,20', world: null }, 'http://localhost:5173/whats-on')).toBe(
        'http://localhost:5173/whats-on?position=10%2C20'
      )
    })
  })

  describe('when a world is provided', () => {
    it('should produce a /whats-on deep link with the world param and ignore position', () => {
      expect(buildPlaceShareUrl({ position: '10,20', world: 'foo.dcl.eth' }, 'http://localhost:5173/whats-on')).toBe(
        'http://localhost:5173/whats-on?world=foo.dcl.eth'
      )
    })
  })

  describe('when the source URL has env override', () => {
    it('should preserve env in the share link', () => {
      expect(buildPlaceShareUrl({ position: '10,20', world: null }, 'http://localhost:5173/whats-on?env=prod')).toBe(
        'http://localhost:5173/whats-on?env=prod&position=10%2C20'
      )
    })
  })

  describe('when ambient query params are present', () => {
    it('should drop them from the share link', () => {
      expect(
        buildPlaceShareUrl({ position: '10,20', world: null }, 'http://localhost:5173/whats-on?category=music&page=3&debug=true')
      ).toBe('http://localhost:5173/whats-on?position=10%2C20')
    })
  })

  describe('when both position and world are null', () => {
    it('should produce a bare /whats-on URL', () => {
      expect(buildPlaceShareUrl({ position: null, world: null }, 'http://localhost:5173/whats-on?env=prod')).toBe(
        'http://localhost:5173/whats-on?env=prod'
      )
    })
  })
})

describe('parseCoordinates', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the input is a valid coordinate string', () => {
    it('should parse both axes as numbers', () => {
      expect(parseCoordinates('10,20')).toEqual([10, 20])
    })
  })

  describe('when the input has negative values', () => {
    it('should preserve the sign', () => {
      expect(parseCoordinates('-10,-20')).toEqual([-10, -20])
    })
  })

  describe('when the input is not a valid coordinate string', () => {
    it('should fall back to 0,0', () => {
      expect(parseCoordinates('invalid')).toEqual([0, 0])
    })
  })
})

describe('normalizeRecurrence', () => {
  describe('when the interval is null or 1', () => {
    it('should preserve the frequency and default the interval to 1', () => {
      expect(normalizeRecurrence('WEEKLY', null)).toEqual({ frequency: 'WEEKLY', interval: 1 })
      expect(normalizeRecurrence('MONTHLY', 1)).toEqual({ frequency: 'MONTHLY', interval: 1 })
    })
  })

  describe('when DAILY has an interval that is a clean multiple of 365', () => {
    it('should re-express the recurrence as YEARLY', () => {
      expect(normalizeRecurrence('DAILY', 365)).toEqual({ frequency: 'YEARLY', interval: 1 })
      expect(normalizeRecurrence('DAILY', 730)).toEqual({ frequency: 'YEARLY', interval: 2 })
    })
  })

  describe('when DAILY has an interval that is a clean multiple of 7', () => {
    it('should re-express the recurrence as WEEKLY', () => {
      expect(normalizeRecurrence('DAILY', 7)).toEqual({ frequency: 'WEEKLY', interval: 1 })
      expect(normalizeRecurrence('DAILY', 14)).toEqual({ frequency: 'WEEKLY', interval: 2 })
      expect(normalizeRecurrence('DAILY', 28)).toEqual({ frequency: 'WEEKLY', interval: 4 })
    })
  })

  describe('when DAILY has an interval that is not a clean multiple of 7 or 365', () => {
    it('should preserve the DAILY frequency and the interval', () => {
      expect(normalizeRecurrence('DAILY', 3)).toEqual({ frequency: 'DAILY', interval: 3 })
      expect(normalizeRecurrence('DAILY', 10)).toEqual({ frequency: 'DAILY', interval: 10 })
    })
  })

  describe('when the frequency is not DAILY', () => {
    it('should not apply any normalization', () => {
      expect(normalizeRecurrence('WEEKLY', 4)).toEqual({ frequency: 'WEEKLY', interval: 4 })
      expect(normalizeRecurrence('MONTHLY', 12)).toEqual({ frequency: 'MONTHLY', interval: 12 })
    })
  })
})

describe('buildCalendarUrl', () => {
  function baseEvent() {
    return {
      name: 'Test Event',
      description: 'A great event',
      startAt: '2026-05-19T22:30:00.000Z',
      finishAt: '2026-05-19T23:59:00.000Z',
      x: 10,
      y: 20,
      url: 'https://decentraland.org/jump/event?position=10,20'
    }
  }

  describe('when the event has no start date', () => {
    it('should return null', () => {
      expect(buildCalendarUrl({ ...baseEvent(), startAt: null })).toBeNull()
    })
  })

  describe('when the event is not recurrent', () => {
    it('should not include a recur param', () => {
      const url = buildCalendarUrl(baseEvent())
      expect(url).not.toContain('recur=')
    })
  })

  describe('when the event is recurrent', () => {
    describe('and the frequency + interval map directly to RRULE', () => {
      it('should emit a recur param with FREQ and INTERVAL for WEEKLY × 2', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'WEEKLY',
          recurrentInterval: 2
        })
        expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D2')
      })

      it('should omit INTERVAL when the interval is 1', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'WEEKLY',
          recurrentInterval: 1
        })
        expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY')
        expect(url).not.toContain('INTERVAL')
      })
    })

    describe('and the legacy data stores weeks as DAILY × 14', () => {
      it('should normalize the recurrence to WEEKLY × 2 in the RRULE', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'DAILY',
          recurrentInterval: 14
        })
        expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BINTERVAL%3D2')
        expect(url).not.toContain('FREQ%3DDAILY')
      })
    })

    describe('and the event has a recurrent_until date', () => {
      it('should include UNTIL formatted as YYYYMMDDTHHMMSSZ', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'WEEKLY',
          recurrentInterval: 2,
          recurrentUntil: '2026-06-30T22:00:00.000Z'
        })
        expect(url).toContain('UNTIL%3D20260630T220000Z')
      })
    })

    describe('and the event has a recurrent_count but no recurrent_until', () => {
      it('should include COUNT', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'WEEKLY',
          recurrentInterval: 2,
          recurrentCount: 10
        })
        expect(url).toContain('COUNT%3D10')
      })
    })

    describe('and the event has both recurrent_until and recurrent_count', () => {
      it('should prefer UNTIL over COUNT', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'WEEKLY',
          recurrentInterval: 2,
          recurrentCount: 10,
          recurrentUntil: '2026-06-30T22:00:00.000Z'
        })
        expect(url).toContain('UNTIL%3D20260630T220000Z')
        expect(url).not.toContain('COUNT%3D10')
      })
    })

    describe('and the frequency is sub-daily (HOURLY)', () => {
      it('should omit the recur param to stay consistent with the UI label', () => {
        const url = buildCalendarUrl({
          ...baseEvent(),
          recurrent: true,
          recurrentFrequency: 'HOURLY',
          recurrentInterval: 1
        })
        expect(url).not.toContain('recur=')
      })
    })
  })
})

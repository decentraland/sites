import {
  appendRealmParam,
  buildEventJumpInUrl,
  buildEventShareUrl,
  buildJumpInUrl,
  buildPlaceShareUrl,
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

import { appendRealmParam, buildEventJumpInUrl, buildJumpInUrl, parseCoordinates, resolveEventRealm } from './whatsOnUrl'

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

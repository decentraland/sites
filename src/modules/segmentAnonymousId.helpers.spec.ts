/** @jest-environment-options {"url":"https://letsplay.decentraland.org/"} */
import { createAnonymousIdResolver, generateUuid, safeParseStoredId } from './segmentAnonymousId.helpers'

const COOKIE_ID = '11111111-1111-4111-8111-111111111111'
const LOCAL_ID = '22222222-2222-4222-8222-222222222222'

describe('when resolving the browser anonymous identity', () => {
  let originalCookieDescriptor: PropertyDescriptor
  let originalRandomUUID: Crypto['randomUUID']
  let resolver: ReturnType<typeof createAnonymousIdResolver>
  let getSdkId: jest.Mock<string | undefined, []>

  beforeEach(() => {
    originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!
    Object.defineProperty(document, 'cookie', originalCookieDescriptor)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    originalRandomUUID = crypto.randomUUID
    getSdkId = jest.fn(() => undefined)
    resolver = createAnonymousIdResolver(getSdkId)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(document, 'cookie', originalCookieDescriptor)
    Object.defineProperty(crypto, 'randomUUID', { value: originalRandomUUID, configurable: true })
    localStorage.clear()
    document.cookie = 'ajs_anonymous_id=; path=/; max-age=0'
    document.cookie = 'ajs_anonymous_id=; domain=.decentraland.org; path=/; max-age=0'
  })

  describe('and there is no identity yet', () => {
    let cookieWrites: ReturnType<typeof jest.spyOn>
    beforeEach(() => {
      cookieWrites = jest.spyOn(document, 'cookie', 'set')
    })
    it('should persist on the writable parent and remove the probe cookie', () => {
      resolver.ensure()
      expect(cookieWrites).toHaveBeenCalledWith(expect.stringMatching(/^ajs_anonymous_id=.*; domain=\.decentraland\.org$/))
      expect(cookieWrites).toHaveBeenCalledWith(
        expect.stringMatching(/^__dcl_segment_domain__[0-9a-f-]+=; domain=\.decentraland\.org; path=\/; max-age=0$/)
      )
      expect(document.cookie).not.toContain('__dcl_segment_domain__')
    })
  })

  describe('and host-only and parent cookies coexist', () => {
    let firstCookieId: string
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${LOCAL_ID}; path=/`
      document.cookie = `ajs_anonymous_id=${COOKIE_ID}; domain=.decentraland.org; path=/`
      firstCookieId = document.cookie.split('; ')[0].split('=')[1]
    })
    it('should match the SDK first-cookie behavior without removing other scopes', () => {
      expect(resolver.ensure()).toBe(firstCookieId)
      expect(document.cookie.match(/ajs_anonymous_id=/g)).toHaveLength(2)
    })
  })

  describe('and only a parent cookie exists', () => {
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${COOKIE_ID}; domain=.decentraland.org; path=/`
    })

    it('should reuse it before Segment boots and synchronize localStorage', () => {
      expect(resolver.ensure()).toBe(COOKIE_ID)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(COOKIE_ID))
    })

    describe('and localStorage disagrees', () => {
      beforeEach(() => localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID)))

      it('should use the cookie for both read-only attribution and beacons', () => {
        expect(resolver.read()).toBe(COOKIE_ID)
        expect(resolver.ensure()).toBe(COOKIE_ID)
        expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(COOKIE_ID))
      })
    })

    describe('and localStorage is blocked', () => {
      beforeEach(() => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new Error('blocked')
        })
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('blocked')
        })
      })

      it('should still use the cookie for every call', () => {
        expect([resolver.ensure(), resolver.ensure()]).toEqual([COOKIE_ID, COOKIE_ID])
      })
    })

    describe('and the SDK has a newly reset identity', () => {
      beforeEach(() => {
        getSdkId.mockReturnValue('custom-sdk-id')
      })

      it('should honor the loaded SDK and persist its identity in both stores', () => {
        expect(resolver.ensure()).toBe('custom-sdk-id')
        expect(document.cookie).toContain('ajs_anonymous_id=custom-sdk-id')
        expect(localStorage.getItem('ajs_anonymous_id')).toBe('"custom-sdk-id"')
      })
    })

    describe('and reading the SDK fails', () => {
      beforeEach(() => {
        getSdkId.mockImplementation(() => {
          throw new Error('not ready')
        })
      })

      it('should still resolve the cookie', () => expect(resolver.ensure()).toBe(COOKIE_ID))
    })
  })

  describe.each([JSON.stringify(LOCAL_ID), LOCAL_ID, 'custom-storage-id'])('and only localStorage contains %s', raw => {
    beforeEach(() => localStorage.setItem('ajs_anonymous_id', raw))

    it('should adopt the stored identity and make it available to other subdomains', () => {
      expect(resolver.ensure()).toBe(safeParseStoredId(raw))
      expect(document.cookie).toContain(`ajs_anonymous_id=${encodeURIComponent(resolver.ensure())}`)
    })
  })

  describe.each(['', '""', 'null', '{}'])('and stores contain an absent or non-string id %s', raw => {
    beforeEach(() => {
      localStorage.setItem('ajs_anonymous_id', raw)
      document.cookie = `ajs_anonymous_id=${encodeURIComponent(raw)}; path=/`
    })

    it('should not mint during a read-only attribution lookup', () => expect(resolver.read()).toBeUndefined())

    it('should mint a UUID and persist raw cookie and JSON localStorage values', () => {
      expect(resolver.ensure()).toMatch(/^[0-9a-f-]{36}$/i)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(resolver.ensure()))
      expect(document.cookie).toContain(`ajs_anonymous_id=${resolver.ensure()}`)
    })
  })

  describe.each(['0', '123', '-42', '1.5'])('and a legacy numeric identity %s is stored', raw => {
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${raw}; path=/`
      localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID))
    })
    it('should preserve the cookie identity as a string and synchronize localStorage', () => {
      expect(resolver.ensure()).toBe(raw)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(raw))
    })
  })

  describe('and the cookie is JSON encoded', () => {
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${encodeURIComponent(JSON.stringify(COOKIE_ID))}; path=/`
    })
    it('should decode and reuse the existing id', () => expect(resolver.ensure()).toBe(COOKIE_ID))
  })

  describe.each([
    ['%ZZ', '%ZZ'],
    ['%41%ZZ', 'A%ZZ']
  ])('and cookie percent escapes are only partly valid: %s', (raw, expected) => {
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${raw}; path=/`
      localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID))
    })
    it('should match js-cookie decoding and keep the cookie identity', () => expect(resolver.ensure()).toBe(expected))
  })

  describe('and a cookie has invalid UTF-8 escapes', () => {
    beforeEach(() => {
      document.cookie = 'ajs_anonymous_id=%FF; path=/'
      localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID))
    })
    it('should ignore the unreadable cookie like js-cookie', () => expect(resolver.ensure()).toBe(LOCAL_ID))
  })

  describe('and cookie access throws', () => {
    beforeEach(() => {
      jest.spyOn(document, 'cookie', 'get').mockImplementation(() => {
        throw new Error('sandboxed')
      })
      jest.spyOn(document, 'cookie', 'set').mockImplementation(() => {
        throw new Error('sandboxed')
      })
      localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID))
    })
    it('should retain the localStorage identity', () => expect(resolver.ensure()).toBe(LOCAL_ID))
  })

  describe('and previously persisted identity has been removed from both stores', () => {
    beforeEach(() => {
      localStorage.setItem('ajs_anonymous_id', JSON.stringify('removed-custom-id'))
      resolver.ensure()
      localStorage.clear()
      document.cookie = 'ajs_anonymous_id=; domain=.decentraland.org; path=/; max-age=0'
    })
    it('should mint a new identity instead of reviving a deleted persisted identity', () => {
      expect(resolver.ensure()).toMatch(/^[0-9a-f-]{36}$/i)
    })
  })

  describe('and neither store is usable', () => {
    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      jest.spyOn(document, 'cookie', 'set').mockImplementation(() => undefined)
    })
    it('should keep one anonymous identity for every event in the page', () => {
      expect(resolver.ensure()).toBe(resolver.ensure())
    })
  })

  describe('and an undecodable host cookie precedes a valid parent cookie', () => {
    beforeEach(() => {
      jest.spyOn(document, 'cookie', 'get').mockReturnValue(`ajs_anonymous_id=%FF; ajs_anonymous_id=${COOKIE_ID}`)
      localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID))
    })
    it('should skip the malformed entry and synchronize to the parent identity', () => {
      expect(resolver.ensure()).toBe(COOKIE_ID)
      expect(localStorage.getItem('ajs_anonymous_id')).toBe(JSON.stringify(COOKIE_ID))
    })
  })

  describe.each([
    ['"null"', undefined],
    ['"a%22b"', 'a"b']
  ])('and a raw quoted cookie contains %s', (raw, expected) => {
    beforeEach(() => {
      jest.spyOn(document, 'cookie', 'get').mockReturnValue(`ajs_anonymous_id=${raw}`)
    })
    it('should strip raw quotes before decoding like js-cookie', () => expect(resolver.read()).toBe(expected))
  })

  describe('and cookies are blocked while storage remains readable', () => {
    let writes: ReturnType<typeof jest.spyOn>
    beforeEach(() => {
      jest.useFakeTimers()
      localStorage.setItem('ajs_anonymous_id', JSON.stringify(LOCAL_ID))
      writes = jest.spyOn(document, 'cookie', 'set').mockImplementation(() => undefined)
    })
    afterEach(() => jest.useRealTimers())
    it('should throttle domain probes and retry after the recovery window', () => {
      resolver.ensure()
      writes.mockClear()
      resolver.ensure()
      expect(writes.mock.calls.filter(([value]: unknown[]) => String(value).startsWith('__dcl_segment_domain__'))).toHaveLength(0)
      jest.advanceTimersByTime(5000)
      resolver.ensure()
      expect(writes.mock.calls.some(([value]: unknown[]) => String(value).startsWith('__dcl_segment_domain__'))).toBe(true)
    })
  })

  describe('and a writable parent domain was already discovered', () => {
    let writes: ReturnType<typeof jest.spyOn>
    beforeEach(() => {
      writes = jest.spyOn(document, 'cookie', 'set')
      resolver.ensure()
      writes.mockClear()
      getSdkId.mockReturnValue('sdk-reset-id')
    })
    it('should reuse the cached parent for a changed identity without probing again', () => {
      expect(resolver.ensure()).toBe('sdk-reset-id')
      expect(writes).toHaveBeenCalledWith(expect.stringMatching(/^ajs_anonymous_id=sdk-reset-id;.*domain=\.decentraland\.org$/))
      expect(writes.mock.calls.some(([value]: unknown[]) => String(value).startsWith('__dcl_segment_domain__'))).toBe(false)
    })
  })

  describe('and a stale legacy probe exists', () => {
    let writes: ReturnType<typeof jest.spyOn>
    beforeEach(() => {
      writes = jest.spyOn(document, 'cookie', 'set')
      document.cookie = '__dcl_segment_domain__=stale; path=/'
    })
    afterEach(() => {
      document.cookie = '__dcl_segment_domain__=; path=/; max-age=0'
    })
    it('should use a unique bounded probe and clean it after read-back', () => {
      resolver.ensure()
      expect(writes.mock.calls.some(([value]: unknown[]) => /^__dcl_segment_domain__[0-9a-f-]+=.*; max-age=5$/.test(String(value)))).toBe(
        true
      )
      expect(writes.mock.calls.some(([value]: unknown[]) => /^__dcl_segment_domain__[0-9a-f-]+=;.*max-age=0$/.test(String(value)))).toBe(
        true
      )
    })
  })

  describe('and crypto.randomUUID is unavailable', () => {
    beforeEach(() => {
      Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    })
    it('should generate a UUID v4', () =>
      expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))
  })
})

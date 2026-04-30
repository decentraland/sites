// Polyfill localStorage for Node test environment
const store: Record<string, string> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach(k => delete store[k])
  }
}

// jsdom provides `document.cookie`. Each `setCookie` call appends a single
// `name=value` pair (jsdom's cookie jar handles aggregation). `clearCookies`
// expires every cookie currently in the jar so tests are isolated.
function setCookie(nameAndValue: string): void {
  document.cookie = nameAndValue
}
function clearCookies(): void {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim()
    if (!name) continue
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }
}

import { useAnonUserId } from './useAnonUserId'

// Mock react-router-dom's useSearchParams
let mockSearchParams: URLSearchParams

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams]
}))

// Mock useMemo to execute the factory immediately (no React runtime needed)
jest.mock('react', () => ({
  useMemo: (fn: () => unknown) => fn()
}))

const VALID_UUID_1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_UUID_2 = 'f9e8d7c6-b5a4-3210-fedc-ba9876543210'
const VALID_UUID_3 = '11111111-2222-3333-4444-555555555555'

describe('useAnonUserId', () => {
  afterEach(() => {
    localStorage.clear()
    clearCookies()
    jest.restoreAllMocks()
  })

  describe('when anon_user_id is a valid UUID in URL search params', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams(`?anon_user_id=${VALID_UUID_1}`)
      result = useAnonUserId()
    })

    it('should return the URL param value', () => {
      expect(result).toBe(VALID_UUID_1)
    })
  })

  describe('when anon_user_id is present but not a valid UUID', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams('?anon_user_id=not-a-uuid')
      result = useAnonUserId()
    })

    it('should reject the malformed value and return undefined', () => {
      expect(result).toBeUndefined()
    })
  })

  describe('when anon_user_id is absent from URL search params', () => {
    describe('and Segment anonymous ID is in the cookie', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        setCookie(`ajs_anonymous_id=${VALID_UUID_2}`)
        result = useAnonUserId()
      })

      it('should return the cookie value', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and the cookie value is URL-encoded with quotes (analytics-next format)', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        setCookie(`ajs_anonymous_id=%22${VALID_UUID_2}%22`)
        result = useAnonUserId()
      })

      it('should decode and strip quotes', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and the cookie value is wrapped in literal quotes (no encoding)', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        setCookie(`ajs_anonymous_id="${VALID_UUID_2}"`)
        result = useAnonUserId()
      })

      it('should strip literal quotes', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and the cookie value has malformed percent-encoding', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        // %ZZ is invalid percent-encoding → decodeURIComponent throws
        setCookie(`ajs_anonymous_id=%ZZ${VALID_UUID_2}`)
        result = useAnonUserId()
      })

      it('should fall through to undefined without throwing', () => {
        expect(result).toBeUndefined()
      })
    })

    describe('and the cookie value coexists with other cookies', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        setCookie('other_cookie=foo')
        setCookie(`ajs_anonymous_id=${VALID_UUID_2}`)
        setCookie('another=bar')
        result = useAnonUserId()
      })

      it('should isolate and return the ajs_anonymous_id value', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and Segment anonymous ID is only in localStorage (no cookie)', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        localStorage.setItem('ajs_anonymous_id', VALID_UUID_2)
        result = useAnonUserId()
      })

      it('should fall back to localStorage', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and Segment anonymous ID is JSON-encoded in localStorage', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        localStorage.setItem('ajs_anonymous_id', `"${VALID_UUID_2}"`)
        result = useAnonUserId()
      })

      it('should strip quotes and return the UUID', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and localStorage contains a non-UUID string', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        localStorage.setItem('ajs_anonymous_id', 'some-random-string')
        result = useAnonUserId()
      })

      it('should return undefined', () => {
        expect(result).toBeUndefined()
      })
    })

    describe('and neither cookie nor localStorage have the Segment key', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        result = useAnonUserId()
      })

      it('should return undefined', () => {
        expect(result).toBeUndefined()
      })
    })
  })

  describe('when URL param, cookie, and localStorage all have valid UUIDs', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams(`?anon_user_id=${VALID_UUID_3}`)
      setCookie(`ajs_anonymous_id=${VALID_UUID_1}`)
      localStorage.setItem('ajs_anonymous_id', VALID_UUID_2)
      result = useAnonUserId()
    })

    it('should return the URL param value taking top priority', () => {
      expect(result).toBe(VALID_UUID_3)
    })
  })

  describe('when only cookie and localStorage have valid UUIDs (no URL param)', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams('')
      setCookie(`ajs_anonymous_id=${VALID_UUID_1}`)
      localStorage.setItem('ajs_anonymous_id', VALID_UUID_2)
      result = useAnonUserId()
    })

    it('should return the cookie value taking priority over localStorage', () => {
      expect(result).toBe(VALID_UUID_1)
    })
  })
})

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
    describe('and Segment anonymous ID is in localStorage', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        localStorage.setItem('ajs_anonymous_id', VALID_UUID_2)
        result = useAnonUserId()
      })

      it('should return the Segment anonymous ID', () => {
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

    describe('and localStorage does not have the Segment key', () => {
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

  describe('when both URL param and localStorage have valid UUIDs', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams(`?anon_user_id=${VALID_UUID_3}`)
      localStorage.setItem('ajs_anonymous_id', VALID_UUID_2)
      result = useAnonUserId()
    })

    it('should return the URL param value taking priority over localStorage', () => {
      expect(result).toBe(VALID_UUID_3)
    })
  })
})

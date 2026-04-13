// Polyfill window for Node test environment (source code references `window.analytics`)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).window = globalThis

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).analytics
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
    describe('and Segment anonymous ID is a valid UUID', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(globalThis as any).analytics = {
          user: () => ({
            anonymousId: () => VALID_UUID_2
          })
        }
        result = useAnonUserId()
      })

      it('should return the Segment anonymous ID', () => {
        expect(result).toBe(VALID_UUID_2)
      })
    })

    describe('and Segment returns a non-UUID string', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(globalThis as any).analytics = {
          user: () => ({
            anonymousId: () => 'some-random-string'
          })
        }
        result = useAnonUserId()
      })

      it('should return undefined', () => {
        expect(result).toBeUndefined()
      })
    })

    describe('and Segment anonymous ID is not available', () => {
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

  describe('when both URL param and Segment anonymous ID are valid UUIDs', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams(`?anon_user_id=${VALID_UUID_3}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any).analytics = {
        user: () => ({
          anonymousId: () => VALID_UUID_2
        })
      }
      result = useAnonUserId()
    })

    it('should return the URL param value taking priority over Segment ID', () => {
      expect(result).toBe(VALID_UUID_3)
    })
  })

  describe('when Segment analytics object exists but user() returns undefined', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams('')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any).analytics = {
        user: () => undefined
      }
      result = useAnonUserId()
    })

    it('should return undefined', () => {
      expect(result).toBeUndefined()
    })
  })

  describe('when Segment analytics object exists but anonymousId() returns null', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams('')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any).analytics = {
        user: () => ({
          anonymousId: () => null
        })
      }
      result = useAnonUserId()
    })

    it('should return undefined', () => {
      expect(result).toBeUndefined()
    })
  })
})

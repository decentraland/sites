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

describe('useAnonUserId', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).analytics
    jest.restoreAllMocks()
  })

  describe('when anon_user_id is present in URL search params', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams('?anon_user_id=url-anon-123')
      result = useAnonUserId()
    })

    it('should return the URL param value', () => {
      expect(result).toBe('url-anon-123')
    })
  })

  describe('when anon_user_id is absent from URL search params', () => {
    describe('and Segment anonymous ID is available', () => {
      let result: string | undefined

      beforeEach(() => {
        mockSearchParams = new URLSearchParams('')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(globalThis as any).analytics = {
          user: () => ({
            anonymousId: () => 'segment-anon-456'
          })
        }
        result = useAnonUserId()
      })

      it('should return the Segment anonymous ID', () => {
        expect(result).toBe('segment-anon-456')
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

  describe('when both URL param and Segment anonymous ID are present', () => {
    let result: string | undefined

    beforeEach(() => {
      mockSearchParams = new URLSearchParams('?anon_user_id=url-anon-789')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(globalThis as any).analytics = {
        user: () => ({
          anonymousId: () => 'segment-anon-999'
        })
      }
      result = useAnonUserId()
    })

    it('should return the URL param value taking priority over Segment ID', () => {
      expect(result).toBe('url-anon-789')
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

import { isClientError } from './deepLinkErrors'

describe('isClientError', () => {
  describe('when the error is a 4xx HTTP status', () => {
    it('should be treated as a client error so the deep link is dropped from the URL', () => {
      expect(isClientError({ status: 404 })).toBe(true)
      expect(isClientError({ status: 410 })).toBe(true)
      expect(isClientError({ status: 400 })).toBe(true)
    })
  })

  describe('when the error is a 5xx HTTP status', () => {
    it('should NOT be treated as a client error so a transient API blip does not destroy the deep link', () => {
      expect(isClientError({ status: 500 })).toBe(false)
      expect(isClientError({ status: 502 })).toBe(false)
      expect(isClientError({ status: 503 })).toBe(false)
    })
  })

  describe('when the error has a non-numeric status (FETCH_ERROR / network)', () => {
    it('should NOT be treated as a client error', () => {
      expect(isClientError({ status: 'FETCH_ERROR', error: 'network down' })).toBe(false)
    })
  })

  describe('when the error is missing or malformed', () => {
    it('should be treated as not a client error', () => {
      expect(isClientError(null)).toBe(false)
      expect(isClientError(undefined)).toBe(false)
      expect(isClientError({})).toBe(false)
      expect(isClientError('string error')).toBe(false)
    })
  })
})

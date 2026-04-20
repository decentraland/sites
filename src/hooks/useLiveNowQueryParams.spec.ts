import { renderHook } from '@testing-library/react'
import { useLiveNowQueryParams } from './useLiveNowQueryParams'

describe('when useLiveNowQueryParams is called', () => {
  const originalLocation = window.location

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
  })

  describe('and the URL has no minUsers param', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', { value: { search: '' }, writable: true })
    })

    it('should return undefined', () => {
      const { result } = renderHook(() => useLiveNowQueryParams())

      expect(result.current).toBeUndefined()
    })
  })

  describe('and the URL has a valid minUsers param', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', { value: { search: '?minUsers=5' }, writable: true })
    })

    it('should return the parsed minUsers value', () => {
      const { result } = renderHook(() => useLiveNowQueryParams())

      expect(result.current).toEqual({ minUsers: 5 })
    })
  })

  describe('and the URL has a non-numeric minUsers param', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', { value: { search: '?minUsers=abc' }, writable: true })
    })

    it('should return undefined', () => {
      const { result } = renderHook(() => useLiveNowQueryParams())

      expect(result.current).toBeUndefined()
    })
  })
})

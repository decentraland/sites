import { renderHook } from '@testing-library/react'
import { useFormatMessage, useIntl } from './useFormatMessage'

const tMock = jest.fn((key: string, values?: Record<string, string | number>) => (values ? `${key}:${JSON.stringify(values)}` : key))
const intlStub = { formatMessage: jest.fn(), locale: 'en' }

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: tMock, intl: intlStub })
}))

describe('useFormatMessage', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the id is falsy', () => {
    it('should return an empty string for undefined without calling t', () => {
      const { result } = renderHook(() => useFormatMessage())
      expect(result.current(undefined)).toBe('')
      expect(tMock).not.toHaveBeenCalled()
    })

    it('should return an empty string for null', () => {
      const { result } = renderHook(() => useFormatMessage())
      expect(result.current(null)).toBe('')
    })

    it('should return an empty string for an empty string id', () => {
      const { result } = renderHook(() => useFormatMessage())
      expect(result.current('')).toBe('')
    })
  })

  describe('when given a valid id', () => {
    it('should delegate to the translation function', () => {
      const { result } = renderHook(() => useFormatMessage())
      expect(result.current('greeting')).toBe('greeting')
      expect(tMock).toHaveBeenCalledWith('greeting', undefined)
    })

    it('should forward interpolation values', () => {
      const { result } = renderHook(() => useFormatMessage())
      expect(result.current('greeting', { name: 'Ada' })).toBe('greeting:{"name":"Ada"}')
    })
  })

  describe('when the translation function reference is stable', () => {
    it('should return a memoized formatter across re-renders', () => {
      const { result, rerender } = renderHook(() => useFormatMessage())
      const first = result.current
      rerender()
      expect(result.current).toBe(first)
    })
  })
})

describe('useIntl', () => {
  it('should return the intl instance from the translation hook', () => {
    const { result } = renderHook(() => useIntl())
    expect(result.current).toBe(intlStub)
  })
})

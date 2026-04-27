import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { useBlogPageTracking } from './useBlogPageTracking'

jest.mock('@dcl/hooks', () => ({
  useAnalytics: jest.fn()
}))

const useAnalyticsMock = useAnalytics as jest.MockedFunction<typeof useAnalytics>

describe('useBlogPageTracking', () => {
  let pageMock: jest.Mock

  beforeEach(() => {
    pageMock = jest.fn()
    useAnalyticsMock.mockReturnValue({
      isInitialized: true,
      page: pageMock,
      track: jest.fn(),
      identify: jest.fn()
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when analytics is not initialized', () => {
    beforeEach(() => {
      useAnalyticsMock.mockReturnValue({
        isInitialized: false,
        page: pageMock,
        track: jest.fn(),
        identify: jest.fn()
      })
    })

    it('should not call page', () => {
      renderHook(() => useBlogPageTracking({ name: 'Blog Post', properties: { title: 'Hello' } }))

      expect(pageMock).not.toHaveBeenCalled()
    })
  })

  describe('when name is undefined', () => {
    it('should not call page', () => {
      renderHook(() => useBlogPageTracking({ name: undefined, properties: { title: 'Hello' } }))

      expect(pageMock).not.toHaveBeenCalled()
    })
  })

  describe('when name is empty string', () => {
    it('should not call page', () => {
      renderHook(() => useBlogPageTracking({ name: '', properties: { title: 'Hello' } }))

      expect(pageMock).not.toHaveBeenCalled()
    })
  })

  describe('when name and analytics are ready', () => {
    it('should call page with name and properties', () => {
      renderHook(() => useBlogPageTracking({ name: 'Blog Post', properties: { title: 'Hello', slug: 'hello' } }))

      expect(pageMock).toHaveBeenCalledWith('Blog Post', { title: 'Hello', slug: 'hello' })
    })

    it('should call page once for stable args across re-renders', () => {
      const { rerender } = renderHook(({ name }) => useBlogPageTracking({ name, properties: { title: 'Hello' } }), {
        initialProps: { name: 'Blog Post' }
      })

      rerender({ name: 'Blog Post' })

      expect(pageMock).toHaveBeenCalledTimes(1)
    })

    it('should re-fire page when name changes', () => {
      const { rerender } = renderHook(({ name }) => useBlogPageTracking({ name, properties: { title: 'A' } }), {
        initialProps: { name: 'Post A' }
      })

      rerender({ name: 'Post B' })

      expect(pageMock).toHaveBeenCalledTimes(2)
      expect(pageMock).toHaveBeenLastCalledWith('Post B', { title: 'A' })
    })

    it('should re-fire page when properties change', () => {
      const { rerender } = renderHook(({ properties }) => useBlogPageTracking({ name: 'Post', properties }), {
        initialProps: { properties: { title: 'A' } as Record<string, unknown> }
      })

      rerender({ properties: { title: 'B' } })

      expect(pageMock).toHaveBeenCalledTimes(2)
      expect(pageMock).toHaveBeenLastCalledWith('Post', { title: 'B' })
    })
  })

  describe('when properties is omitted', () => {
    it('should call page with undefined properties', () => {
      renderHook(() => useBlogPageTracking({ name: 'Blog' }))

      expect(pageMock).toHaveBeenCalledWith('Blog', undefined)
    })
  })
})

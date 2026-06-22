import { act, renderHook } from '@testing-library/react'
import { usePagination } from './usePagination'

const range = (count: number) => Array.from({ length: count }, (_, i) => i)

describe('usePagination', () => {
  describe('when the list fits a single page', () => {
    it('should expose the whole list on page 0', () => {
      const { result } = renderHook(() => usePagination(range(5), 10))
      expect(result.current.page).toBe(0)
      expect(result.current.rowsPerPage).toBe(10)
      expect(result.current.paginated).toEqual(range(5))
    })
  })

  describe('when the list spans multiple pages', () => {
    it('should slice the list to the current page window', () => {
      const { result } = renderHook(() => usePagination(range(25), 10))
      expect(result.current.paginated).toEqual(range(10))
    })

    it('should advance to the next page', () => {
      const { result } = renderHook(() => usePagination(range(25), 10))
      act(() => result.current.onPageChange(null, 1))
      expect(result.current.page).toBe(1)
      expect(result.current.paginated).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    })
  })

  describe('when the rows-per-page changes', () => {
    it('should reset back to the first page', () => {
      const { result } = renderHook(() => usePagination(range(60), 10))
      act(() => result.current.onPageChange(null, 2))
      expect(result.current.page).toBe(2)
      act(() => result.current.onRowsPerPageChange({ target: { value: '50' } } as never))
      expect(result.current.page).toBe(0)
      expect(result.current.rowsPerPage).toBe(50)
      expect(result.current.paginated).toHaveLength(50)
    })
  })

  describe('when the list shrinks below the current page', () => {
    it('should clamp the page back into range', () => {
      const { result, rerender } = renderHook(({ items }) => usePagination(items, 10), {
        initialProps: { items: range(25) }
      })
      act(() => result.current.onPageChange(null, 2))
      expect(result.current.page).toBe(2)
      rerender({ items: range(11) })
      expect(result.current.page).toBe(1)
      expect(result.current.paginated).toEqual([10])
    })
  })

  describe('when no default page size is given', () => {
    it('should fall back to 10 rows per page', () => {
      const { result } = renderHook(() => usePagination(range(30)))
      expect(result.current.rowsPerPage).toBe(10)
    })
  })
})

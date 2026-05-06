import { act, renderHook } from '@testing-library/react'
import { usePaginatedQuery } from './usePaginatedQuery'

type FakeData = { items: number[]; total: number }

describe('usePaginatedQuery', () => {
  describe('when the query is enabled', () => {
    it('should call the query hook with the default offset/limit', () => {
      const queryHook = jest.fn().mockReturnValue({
        data: { items: [1, 2, 3], total: 3 } as FakeData,
        isLoading: false,
        isFetching: false
      })

      renderHook(() =>
        usePaginatedQuery<{ id: string; limit?: number; offset?: number }, FakeData, number[]>({
          queryHook,
          queryArg: { id: 'a' },
          defaultLimit: 10,
          extractItems: data => data.items,
          extractTotal: data => data.total,
          getHasMore: data => data.items.length < data.total
        })
      )

      expect(queryHook).toHaveBeenCalledWith({ id: 'a', limit: 10, offset: 0 }, { skip: false })
    })

    it('should advance offset by limit on loadMore when hasMore is true', () => {
      const queryHook = jest.fn().mockReturnValue({
        data: { items: [1, 2], total: 5 } as FakeData,
        isLoading: false,
        isFetching: false
      })

      const { result } = renderHook(() =>
        usePaginatedQuery<{ id: string; limit?: number; offset?: number }, FakeData, number[]>({
          queryHook,
          queryArg: { id: 'a' },
          defaultLimit: 2,
          extractItems: data => data.items,
          extractTotal: data => data.total,
          getHasMore: data => data.items.length < data.total
        })
      )

      act(() => {
        result.current.loadMore()
      })

      expect(queryHook).toHaveBeenLastCalledWith({ id: 'a', limit: 2, offset: 2 }, { skip: false })
    })
  })

  describe('when the query is disabled', () => {
    it('should pass skip: true to the query hook', () => {
      const queryHook = jest.fn().mockReturnValue({ data: undefined, isLoading: false, isFetching: false })

      renderHook(() =>
        usePaginatedQuery<{ id: string; limit?: number; offset?: number }, FakeData, number[]>({
          queryHook,
          queryArg: { id: 'a' },
          enabled: false,
          extractItems: data => data.items,
          extractTotal: data => data.total,
          getHasMore: () => false
        })
      )

      expect(queryHook).toHaveBeenCalledWith({ id: 'a', limit: 10, offset: 0 }, { skip: true })
    })
  })
})

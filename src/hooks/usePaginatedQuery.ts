import { useCallback, useEffect, useRef, useState } from 'react'

type PaginatedQueryHook<TQueryArg, TData> = (
  arg: TQueryArg,
  options?: { skip?: boolean }
) => {
  data?: TData
  isLoading: boolean
  isFetching: boolean
}

type UsePaginatedQueryOptions<TQueryArg extends { limit?: number; offset?: number }, TData, TItems extends unknown[]> = {
  queryHook: PaginatedQueryHook<TQueryArg, TData>
  queryArg: Omit<TQueryArg, 'limit' | 'offset'>
  enabled?: boolean
  defaultLimit?: number
  extractItems: (data: TData) => TItems
  extractTotal: (data: TData) => number
  getHasMore: (data: TData, currentOffset?: number, limit?: number) => boolean
  resetDependency?: unknown
}

function usePaginatedQuery<TQueryArg extends { limit?: number; offset?: number }, TData, TItems extends unknown[]>({
  queryHook,
  queryArg,
  enabled = true,
  defaultLimit = 10,
  extractItems,
  extractTotal,
  getHasMore,
  resetDependency
}: UsePaginatedQueryOptions<TQueryArg, TData, TItems>) {
  const [limit] = useState(defaultLimit)
  const [currentOffset, setCurrentOffset] = useState(0)
  const dataRef = useRef<TData | null>(null)
  const isFetchingRef = useRef<boolean>(false)
  const totalRef = useRef<number>(0)
  const extractItemsRef = useRef(extractItems)
  const extractTotalRef = useRef(extractTotal)
  const getHasMoreRef = useRef(getHasMore)

  useEffect(() => {
    extractItemsRef.current = extractItems
    extractTotalRef.current = extractTotal
    getHasMoreRef.current = getHasMore
  })

  useEffect(() => {
    setCurrentOffset(0)
    dataRef.current = null
    totalRef.current = 0
  }, [resetDependency])

  const { data, isLoading, isFetching } = queryHook(
    {
      ...(queryArg as TQueryArg),
      limit,
      offset: currentOffset
    } as TQueryArg,
    { skip: !enabled }
  )

  useEffect(() => {
    if (data) {
      totalRef.current = extractTotalRef.current(data)
      dataRef.current = data
    }
    isFetchingRef.current = isFetching
  }, [data, isFetching])

  const total = data ? extractTotalRef.current(data) : 0
  const items = data ? extractItemsRef.current(data) : ([] as unknown as TItems)
  const hasMore = data ? getHasMoreRef.current(data, currentOffset, limit) : false

  const loadMore = useCallback(() => {
    const currentData = dataRef.current
    if (!currentData || isFetchingRef.current) return
    if (!getHasMoreRef.current(currentData, currentOffset, limit)) return
    setCurrentOffset(prev => {
      const next = prev + limit
      if (totalRef.current && next >= totalRef.current) return prev
      return next
    })
  }, [limit, currentOffset])

  return {
    items,
    isLoading: isLoading && currentOffset === 0,
    isFetchingMore: isFetching && currentOffset > 0,
    hasMore,
    loadMore,
    total
  }
}

export { usePaginatedQuery }

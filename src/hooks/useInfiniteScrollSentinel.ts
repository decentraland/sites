import { useCallback, useEffect, useState } from 'react'

type Options = {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
}

// Sentinel-based infinite scroll. The consumer attaches the returned ref to a
// trailing element and `onLoadMore` fires when that element intersects the
// viewport (or its scroll root, depending on rootMargin).
//
// The node is tracked via a CALLBACK ref held in state — not a RefObject read
// inside the effect — so when React replaces the sentinel element (branch
// remounts, list re-renders), the observer re-attaches to the fresh node
// instead of silently watching a detached one.
function useInfiniteScrollSentinel(options: Options) {
  const { hasMore, isLoading, onLoadMore, threshold = 0.1, rootMargin = '100px' } = options
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null)
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinel(node)
  }, [])

  useEffect(() => {
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) onLoadMore()
      },
      { threshold, rootMargin }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, hasMore, isLoading, onLoadMore, threshold, rootMargin])

  return sentinelRef
}

export { useInfiniteScrollSentinel }

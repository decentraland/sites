import { useEffect, useRef } from 'react'

type Options = {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
}

// Sentinel-based infinite scroll. Use when the loadable area sits inside an
// `overflow: auto` container — the consumer attaches the returned ref to a
// trailing element and onLoadMore fires when that element intersects the
// viewport (or its scroll root, depending on rootMargin).
function useInfiniteScrollSentinel(options: Options) {
  const { hasMore, isLoading, onLoadMore, threshold = 0.1, rootMargin = '100px' } = options
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) onLoadMore()
      },
      { threshold, rootMargin }
    )
    observer.observe(sentinel)
    return () => observer.unobserve(sentinel)
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin])

  return sentinelRef
}

export { useInfiniteScrollSentinel }

import { memo, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { useTranslation } from '@dcl/hooks'
import { DOT_GAP, DOT_SIZE, DOT_SLOT, PaginationDot, PaginationTrack, PaginationViewport } from './LiveNowPagination.styled'

// One dot of context shown on each side of the highlighted range.
const CONTEXT_DOTS = 1

type LiveNowPaginationProps = {
  // Total number of cards (one dot each).
  count: number
  // Index of the first currently-visible card.
  rangeStart: number
  // How many cards are visible at once (how many dots are highlighted).
  rangeSize: number
  onSelect: (index: number) => void
  label: string
}

function LiveNowPaginationComponent({ count, rangeStart, rangeSize, onSelect, label }: LiveNowPaginationProps) {
  const { t } = useTranslation()

  const handleKeyDown = useCallback(
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onSelect((index + 1) % count)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onSelect((index - 1 + count) % count)
      }
    },
    [count, onSelect]
  )

  // Nothing to paginate when every card is visible at once.
  if (count <= rangeSize) return null

  // Show the highlighted range plus a context dot on each side, keeping it
  // within the strip; the window slides as the visible range moves and the
  // out-of-range dots fade at the edges.
  const windowSize = Math.min(count, rangeSize + CONTEXT_DOTS * 2)
  const maxStart = Math.max(0, count - windowSize)
  const windowStart = Math.min(Math.max(0, rangeStart - CONTEXT_DOTS), maxStart)
  const fadeStart = windowStart > 0
  const fadeEnd = windowStart + windowSize < count
  const viewportWidth = windowSize * DOT_SIZE + (windowSize - 1) * DOT_GAP

  return (
    <PaginationViewport role="group" aria-label={label} viewportWidth={viewportWidth} fadeStart={fadeStart} fadeEnd={fadeEnd}>
      <PaginationTrack offset={windowStart * DOT_SLOT}>
        {Array.from({ length: count }, (_, index) => {
          const isHighlighted = index >= rangeStart && index < rangeStart + rangeSize
          return (
            <PaginationDot
              key={index}
              active={isHighlighted}
              aria-current={isHighlighted ? 'true' : undefined}
              tabIndex={index === rangeStart ? 0 : -1}
              onClick={() => onSelect(index)}
              onKeyDown={handleKeyDown(index)}
              aria-label={t('pagination.go_to_page', { page: index + 1 })}
            />
          )
        })}
      </PaginationTrack>
    </PaginationViewport>
  )
}

const LiveNowPagination = memo(LiveNowPaginationComponent)

export { LiveNowPagination }

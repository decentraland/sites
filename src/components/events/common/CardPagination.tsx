import { memo, useCallback } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useTranslation } from '@dcl/hooks'
import { DOT_GAP, DOT_SIZE, DOT_SLOT, PaginationDot, PaginationTrack, PaginationViewport } from './CardPagination.styled'

// One dot of context shown on each side of the highlighted range.
const CONTEXT_DOTS = 1

type CardPaginationProps = {
  // Total number of dots (one per card or per page).
  count: number
  // Index of the first highlighted dot (the first visible card / current page).
  rangeStart: number
  // How many contiguous dots are highlighted (visible cards; 1 for paged carousels).
  rangeSize: number
  onSelect: (index: number) => void
  label: string
}

function CardPaginationComponent({ count, rangeStart, rangeSize, onSelect, label }: CardPaginationProps) {
  const { t } = useTranslation()

  // Stable handlers (one per render, not one per dot) that read the dot index
  // from `data-index`, so the dot list stays allocation-free.
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => onSelect(Number(event.currentTarget.dataset.index)), [onSelect])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.dataset.index)
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

  // Nothing to paginate when everything is visible at once.
  if (count <= rangeSize) return null

  // Show the highlighted range plus a context dot on each side, keeping it
  // within the strip; the window slides as the highlighted range moves and the
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
              data-index={index}
              aria-current={isHighlighted ? 'true' : undefined}
              tabIndex={index === rangeStart ? 0 : -1}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              aria-label={t('pagination.go_to_page', { page: index + 1 })}
            />
          )
        })}
      </PaginationTrack>
    </PaginationViewport>
  )
}

const CardPagination = memo(CardPaginationComponent)

export { CardPagination }

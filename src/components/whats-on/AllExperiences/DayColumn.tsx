import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { EventEntry } from '../../../features/whats-on-events'
import { CardScrollArea, ColumnFiller, DayColumnContainer, SkeletonCard } from './DayColumn.styled'

interface DayColumnProps {
  events: EventEntry[]
  isLoading: boolean
  dateLabel: string
  renderCard: (event: EventEntry) => React.ReactNode
}

const DayColumn = memo(({ events, isLoading, dateLabel, renderCard }: DayColumnProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startY: 0, scrollTop: 0 })
  const [hasOverflow, setHasOverflow] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setHasOverflow(el.scrollHeight > el.clientHeight)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [events, isLoading])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollRef.current
    if (!container) return
    dragState.current = { isDown: true, startY: e.clientY, scrollTop: container.scrollTop }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.isDown) return
    const container = scrollRef.current
    if (!container) return
    e.preventDefault()
    const walk = e.clientY - dragState.current.startY
    container.scrollTop = dragState.current.scrollTop - walk
  }, [])

  const handleMouseUp = useCallback(() => {
    dragState.current.isDown = false
  }, [])

  return (
    <DayColumnContainer role="list" aria-label={dateLabel}>
      <CardScrollArea
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isLoading && (
          <>
            <SkeletonCard role="listitem" aria-hidden="true" />
            <SkeletonCard role="listitem" aria-hidden="true" />
            <SkeletonCard role="listitem" aria-hidden="true" />
          </>
        )}
        {!isLoading &&
          events.map(event => (
            <div key={`${event.id}-${event.start_at}`} role="listitem">
              {renderCard(event)}
            </div>
          ))}
        {!hasOverflow && <ColumnFiller aria-hidden="true" />}
      </CardScrollArea>
    </DayColumnContainer>
  )
})

DayColumn.displayName = 'DayColumn'

export { DayColumn }
export type { DayColumnProps }

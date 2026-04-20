import { useCallback, useEffect, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTranslation } from '@dcl/hooks'
import { useGetLiveNowCardsQuery } from '../../../features/whats-on-events'
import type { LiveNowCard } from '../../../features/whats-on-events'
import { useDocumentVisible } from '../../../hooks/useDocumentVisible'
import { useLiveNowQueryParams } from '../../../hooks/useLiveNowQueryParams'
import { PaginationDot, PaginationDots } from '../common/PaginationDots.styled'
import { EventDetailModal, normalizeLiveNowCard } from '../EventDetailModal'
import type { ModalEventData } from '../EventDetailModal'
import { LiveNowCardItem } from './LiveNowCardItem'
import {
  CarouselWrapper,
  ChevronButton,
  ChevronLayer,
  LiveNowGrid,
  LiveNowHeader,
  LiveNowIcon,
  LiveNowSection,
  LiveNowTitle
} from './LiveNow.styled'

const SCROLL_AMOUNT = 300

function LiveNow() {
  const { t } = useTranslation()
  const queryParams = useLiveNowQueryParams()
  const isVisible = useDocumentVisible()
  const { data: cards = [] } = useGetLiveNowCardsQuery(queryParams, { pollingInterval: isVisible ? 60_000 : 0 })
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [modalData, setModalData] = useState<ModalEventData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const syncScrollState = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const hasScroll = container.scrollWidth > container.clientWidth
    const pages = hasScroll && container.clientWidth > 0 ? Math.max(1, Math.ceil(container.scrollWidth / container.clientWidth)) : 1
    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(hasScroll && container.scrollLeft + container.clientWidth < container.scrollWidth - 1)
    setPageCount(pages)

    const maxScroll = container.scrollWidth - container.clientWidth
    if (maxScroll <= 0) {
      setActiveIndex(0)
    } else {
      const progress = container.scrollLeft / maxScroll
      setActiveIndex(Math.round(progress * (pages - 1)))
    }
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    syncScrollState()
    const observer = new ResizeObserver(syncScrollState)
    observer.observe(container)
    return () => observer.disconnect()
  }, [cards.length, syncScrollState])

  const handleChevronClick = useCallback((direction: 'left' | 'right') => {
    const container = scrollRef.current
    if (!container) return
    const delta = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT
    container.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollRef.current
    if (!container) return
    dragState.current = { isDown: true, startX: e.pageX - container.offsetLeft, scrollLeft: container.scrollLeft }
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.isDown) return
    const container = scrollRef.current
    if (!container) return
    e.preventDefault()
    const x = e.pageX - container.offsetLeft
    const walk = x - dragState.current.startX
    if (Math.abs(walk) > 5) setIsDragging(true)
    container.scrollLeft = dragState.current.scrollLeft - walk
  }, [])

  const handleMouseUp = useCallback(() => {
    dragState.current.isDown = false
  }, [])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) e.stopPropagation()
    },
    [isDragging]
  )

  const handleDotClick = useCallback(
    (index: number) => {
      const container = scrollRef.current
      if (!container) return
      const maxScroll = container.scrollWidth - container.clientWidth
      const scrollTo = pageCount <= 1 ? 0 : (maxScroll * index) / (pageCount - 1)
      container.scrollTo({ left: scrollTo, behavior: 'smooth' })
    },
    [pageCount]
  )

  const handleCardClick = useCallback((card: LiveNowCard) => {
    setModalData(normalizeLiveNowCard(card))
  }, [])

  const handleModalClose = useCallback(() => {
    setModalData(null)
  }, [])

  if (cards.length === 0) return null

  return (
    <LiveNowSection>
      <LiveNowHeader>
        <LiveNowIcon />
        <LiveNowTitle variant="h5">{t('live_now.title')}</LiveNowTitle>
      </LiveNowHeader>
      <ChevronLayer>
        {canScrollLeft && (
          <ChevronButton side="left" onClick={() => handleChevronClick('left')}>
            <ChevronLeftIcon />
          </ChevronButton>
        )}
        {canScrollRight && (
          <ChevronButton side="right" onClick={() => handleChevronClick('right')}>
            <ChevronRightIcon />
          </ChevronButton>
        )}
        <CarouselWrapper
          ref={scrollRef}
          onScroll={syncScrollState}
          fadeLeft={canScrollLeft}
          fadeRight={canScrollRight}
          hasScroll={pageCount > 1}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClickCapture={handleClick}
          sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <LiveNowGrid>
            {cards.map(card => (
              <LiveNowCardItem key={card.id} card={card} onClick={handleCardClick} />
            ))}
          </LiveNowGrid>
        </CarouselWrapper>
      </ChevronLayer>
      {pageCount > 1 && (
        <PaginationDots role="tablist" aria-label={t('live_now.title')}>
          {Array.from({ length: pageCount }, (_, index) => {
            const isActive = index === activeIndex
            return (
              <PaginationDot
                key={index}
                active={isActive}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleDotClick(index)}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    handleDotClick((index + 1) % pageCount)
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    handleDotClick((index - 1 + pageCount) % pageCount)
                  }
                }}
                aria-label={t('pagination.go_to_page', { page: index + 1 })}
              />
            )
          })}
        </PaginationDots>
      )}
      <EventDetailModal open={!!modalData} onClose={handleModalClose} data={modalData} />
    </LiveNowSection>
  )
}

export { LiveNow }

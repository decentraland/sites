import { useCallback, useEffect, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTranslation } from '@dcl/hooks'
import { useGetLiveNowCardsQuery } from '../../../features/events'
import type { LiveNowCard } from '../../../features/events'
import { useDocumentVisible } from '../../../hooks/useDocumentVisible'
import { useLiveNowQueryParams } from '../../../hooks/useLiveNowQueryParams'
import { EventDetailModal, normalizeLiveNowCard } from '../EventDetailModal'
import type { ModalEventData } from '../EventDetailModal'
import { LiveNowCardItem } from './LiveNowCardItem'
import { LiveNowPagination } from './LiveNowPagination'
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

const SCROLL_TOLERANCE_PX = 2

function LiveNow() {
  const { t } = useTranslation()
  const queryParams = useLiveNowQueryParams()
  const isVisible = useDocumentVisible()
  const { data: cards = [] } = useGetLiveNowCardsQuery(queryParams, { pollingInterval: isVisible ? 60_000 : 0 })
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeSize, setRangeSize] = useState(1)
  const [hasScroll, setHasScroll] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [modalData, setModalData] = useState<ModalEventData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const syncScrollState = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const { clientWidth, scrollLeft, scrollWidth } = container
    // Use the average rendered card span (scrollWidth / cardCount) instead of a
    // single card's offsetWidth: it includes the gap and is stable across the
    // layout reflows the carousel triggers when it toggles its own padding.
    const cardCount = cards.length
    const cardSpan = cardCount > 0 && scrollWidth > 0 ? scrollWidth / cardCount : 0
    const cardsPerView = cardSpan > 0 && clientWidth > 0 ? Math.max(1, Math.round(clientWidth / cardSpan)) : 1
    const scrollable = cardCount > cardsPerView

    setRangeSize(cardsPerView)
    setHasScroll(scrollable)
    setCanScrollLeft(scrollable && scrollLeft > SCROLL_TOLERANCE_PX)
    setCanScrollRight(scrollable && scrollLeft + clientWidth < scrollWidth - SCROLL_TOLERANCE_PX)

    // One dot per card; the highlighted range starts at the first visible card.
    const maxFirstVisible = Math.max(0, cardCount - cardsPerView)
    setRangeStart(cardSpan > 0 ? Math.min(Math.max(0, Math.round(scrollLeft / cardSpan)), maxFirstVisible) : 0)
  }, [cards.length])

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
    // Advance one viewport-worth of cards; the highlighted range follows the scroll.
    container.scrollBy({ left: direction === 'left' ? -container.clientWidth : container.clientWidth, behavior: 'smooth' })
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
      const cardSpan = cards.length > 0 ? container.scrollWidth / cards.length : 0
      const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
      // Bring the clicked card to the start of the viewport.
      container.scrollTo({ left: Math.min(index * cardSpan, maxScroll), behavior: 'smooth' })
    },
    [cards.length]
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
          hasScroll={hasScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClickCapture={handleClick}
          sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <LiveNowGrid>
            {cards.map((card, index) => (
              <LiveNowCardItem key={card.id} card={card} onClick={handleCardClick} eager={index === 0} />
            ))}
          </LiveNowGrid>
        </CarouselWrapper>
      </ChevronLayer>
      <LiveNowPagination
        count={cards.length}
        rangeStart={rangeStart}
        rangeSize={rangeSize}
        onSelect={handleDotClick}
        label={t('live_now.title')}
      />
      <EventDetailModal open={!!modalData} onClose={handleModalClose} data={modalData} />
    </LiveNowSection>
  )
}

export { LiveNow }

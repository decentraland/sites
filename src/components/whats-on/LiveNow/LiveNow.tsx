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
import { usePointerDrag } from '../../../hooks/usePointerDrag'
import { CardPagination } from '../common/CardPagination'
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

const SCROLL_TOLERANCE_PX = 2

function LiveNow() {
  const { t } = useTranslation()
  const queryParams = useLiveNowQueryParams()
  const isVisible = useDocumentVisible()
  const { data: cards = [] } = useGetLiveNowCardsQuery(queryParams, { pollingInterval: isVisible ? 60_000 : 0 })
  const [pageCount, setPageCount] = useState(1)
  const [activePage, setActivePage] = useState(0)
  const [hasScroll, setHasScroll] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [modalData, setModalData] = useState<ModalEventData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll so the first card of `page` sits at the start of the viewport. A page
  // is `cardsPerView` cards wide, so the target lands on a card boundary (which
  // is also a scroll-snap point) — no fighting the CSS snap.
  const scrollToPage = useCallback(
    (page: number) => {
      const container = scrollRef.current
      if (!container) return
      const { clientWidth, scrollWidth } = container
      const cardCount = cards.length
      const cardSpan = cardCount > 0 && scrollWidth > 0 ? scrollWidth / cardCount : 0
      const cardsPerView = cardSpan > 0 && clientWidth > 0 ? Math.max(1, Math.round(clientWidth / cardSpan)) : 1
      const maxScroll = Math.max(0, scrollWidth - clientWidth)
      container.scrollTo({ left: Math.min(page * cardsPerView * cardSpan, maxScroll), behavior: 'smooth' })
    },
    [cards.length]
  )

  // On drag release, snap to the page that is currently most in view.
  const handleSettle = useCallback(
    (container: HTMLDivElement) => {
      scrollToPage(container.clientWidth > 0 ? Math.round(container.scrollLeft / container.clientWidth) : 0)
    },
    [scrollToPage]
  )

  const { isDragging, handlers: dragHandlers } = usePointerDrag(scrollRef, { onSettle: handleSettle })

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
    // One dot per page (a viewport-worth of cards), not per card.
    const pages = Math.max(1, Math.ceil(cardCount / cardsPerView))
    const scrollable = pages > 1

    setPageCount(pages)
    setHasScroll(scrollable)
    setCanScrollLeft(scrollable && scrollLeft > SCROLL_TOLERANCE_PX)
    setCanScrollRight(scrollable && scrollLeft + clientWidth < scrollWidth - SCROLL_TOLERANCE_PX)

    setActivePage(scrollable && clientWidth > 0 ? Math.min(Math.max(0, Math.round(scrollLeft / clientWidth)), pages - 1) : 0)
  }, [cards.length])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    syncScrollState()
    const observer = new ResizeObserver(syncScrollState)
    observer.observe(container)
    return () => observer.disconnect()
  }, [cards.length, syncScrollState])

  const handleChevronClick = useCallback(
    (direction: 'left' | 'right') => {
      const container = scrollRef.current
      if (!container || container.clientWidth === 0) return
      const current = Math.round(container.scrollLeft / container.clientWidth)
      scrollToPage(Math.max(0, Math.min(pageCount - 1, current + (direction === 'left' ? -1 : 1))))
    },
    [pageCount, scrollToPage]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) e.stopPropagation()
    },
    [isDragging]
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
          {...dragHandlers}
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
      <CardPagination count={pageCount} rangeStart={activePage} rangeSize={1} onSelect={scrollToPage} label={t('live_now.title')} />
      <EventDetailModal open={!!modalData} onClose={handleModalClose} data={modalData} />
    </LiveNowSection>
  )
}

export { LiveNow }

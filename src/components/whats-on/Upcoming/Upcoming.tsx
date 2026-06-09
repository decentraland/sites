import { useCallback, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useTranslation } from '@dcl/hooks'
import { isPubliclyVisibleEvent, useGetUpcomingEventsQuery } from '../../../features/events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useEventDetailModal } from '../../../hooks/useEventDetailModal'
import { usePointerDrag } from '../../../hooks/usePointerDrag'
import { chunk } from '../../../utils/whatsOnChunk'
import { CardPagination } from '../common/CardPagination'
import { EventDetailModal } from '../EventDetailModal'
import { UpcomingCard } from './UpcomingCard'
import { DesktopGrid, MobileCarousel, MobileCarouselPage, MobileCarouselTrack, UpcomingSection, UpcomingTitle } from './Upcoming.styled'

const PAGE_SIZE = 4

function Upcoming() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const { data: events = [] } = useGetUpcomingEventsQuery(identity ? { identity } : undefined)
  const [activePage, setActivePage] = useState(0)
  const { closeEventDetailModal, editActiveEvent, modalData, openEventDetailModal } = useEventDetailModal()
  const trackRef = useRef<HTMLDivElement>(null)
  const { isDragging, handlers: dragHandlers } = usePointerDrag(trackRef)

  const visibleEvents = useMemo(() => events.filter(isPubliclyVisibleEvent), [events])

  const pages = useMemo(() => chunk(visibleEvents, PAGE_SIZE), [visibleEvents])

  const handleScroll = useCallback(() => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActivePage(index)
  }, [])

  const handleDotClick = useCallback((index: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }, [])

  const handleClickCapture = useCallback(
    (e: MouseEvent) => {
      if (isDragging) e.stopPropagation()
    },
    [isDragging]
  )

  if (visibleEvents.length === 0) return null

  return (
    <UpcomingSection>
      <UpcomingTitle variant="h5">{t('upcoming.title')}</UpcomingTitle>
      <DesktopGrid>
        {visibleEvents.map(event => (
          <UpcomingCard key={event.id} event={event} onClick={openEventDetailModal} />
        ))}
      </DesktopGrid>
      <MobileCarousel>
        <MobileCarouselTrack
          ref={trackRef}
          onScroll={handleScroll}
          {...dragHandlers}
          onClickCapture={handleClickCapture}
          sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {pages.map((page, i) => (
            <MobileCarouselPage key={i}>
              {page.map(event => (
                <UpcomingCard key={event.id} event={event} onClick={openEventDetailModal} disableHover />
              ))}
            </MobileCarouselPage>
          ))}
        </MobileCarouselTrack>
        <CardPagination count={pages.length} rangeStart={activePage} rangeSize={1} onSelect={handleDotClick} label={t('upcoming.title')} />
      </MobileCarousel>
      <EventDetailModal open={!!modalData} onClose={closeEventDetailModal} data={modalData} onEdit={editActiveEvent} />
    </UpcomingSection>
  )
}

export { Upcoming }

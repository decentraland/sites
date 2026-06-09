import { useCallback, useMemo, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, SyntheticEvent } from 'react'
import { useTranslation } from '@dcl/hooks'
import { isPubliclyVisibleEvent, useGetUpcomingEventsQuery } from '../../../features/events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useEventDetailModal } from '../../../hooks/useEventDetailModal'
import { chunk } from '../../../utils/whatsOnChunk'
import { CardPagination } from '../common/CardPagination'
import { EventDetailModal } from '../EventDetailModal'
import { UpcomingCard } from './UpcomingCard'
import { DesktopGrid, MobileCarousel, MobileCarouselPage, MobileCarouselTrack, UpcomingSection, UpcomingTitle } from './Upcoming.styled'

const PAGE_SIZE = 4

// Stop the browser's native drag (e.g. ghost-dragging card images) so it does
// not hijack the pointer-drag swipe.
const preventDefault = (event: SyntheticEvent) => event.preventDefault()

function Upcoming() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const { data: events = [] } = useGetUpcomingEventsQuery(identity ? { identity } : undefined)
  const [activePage, setActivePage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const { closeEventDetailModal, editActiveEvent, modalData, openEventDetailModal } = useEventDetailModal()
  const trackRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

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

  // Pointer events (not mouse) so dragging works with mouse, touch and device
  // emulation, and pointer capture keeps the drag going even when it starts on a
  // card/image inside the track.
  const handlePointerDown = useCallback((e: PointerEvent) => {
    const el = trackRef.current
    // Ignore secondary buttons (right/middle); primary mouse, touch and pen are 0.
    if (!el || (e.button ?? 0) !== 0) return
    dragState.current = { isDown: true, startX: e.clientX, scrollLeft: el.scrollLeft }
    if (typeof el.setPointerCapture === 'function') el.setPointerCapture(e.pointerId)
    // Disable scroll-snap while dragging so the track follows the pointer instead
    // of fighting the mandatory snap points; it is restored on release.
    el.style.scrollSnapType = 'none'
    setIsDragging(false)
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.current.isDown) return
    const el = trackRef.current
    if (!el) return
    const walk = e.clientX - dragState.current.startX
    if (Math.abs(walk) > 5) setIsDragging(true)
    el.scrollLeft = dragState.current.scrollLeft - walk
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!dragState.current.isDown) return
    dragState.current.isDown = false
    const el = trackRef.current
    if (!el) return
    // Restore the CSS scroll-snap so the carousel snaps to the nearest page.
    el.style.scrollSnapType = ''
    if (typeof el.releasePointerCapture === 'function' && el.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleClickCapture}
          onDragStart={preventDefault}
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

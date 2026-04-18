import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { useGetUpcomingEventsQuery } from '../../../features/explore-events'
import type { EventEntry } from '../../../features/explore-events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { chunk } from '../../../utils/exploreChunk'
import { PaginationDot, PaginationDots } from '../common/PaginationDots.styled'
import { EventDetailModal, normalizeEventEntry } from '../EventDetailModal'
import type { ModalEventData } from '../EventDetailModal'
import { UpcomingCard } from './UpcomingCard'
import { DesktopGrid, MobileCarousel, MobileCarouselPage, MobileCarouselTrack, UpcomingSection, UpcomingTitle } from './Upcoming.styled'

const PAGE_SIZE = 4

function Upcoming() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const { data: events = [] } = useGetUpcomingEventsQuery(identity ? { identity } : undefined)
  const [modalData, setModalData] = useState<ModalEventData | null>(null)
  const [activePage, setActivePage] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  const pages = useMemo(() => chunk(events, PAGE_SIZE), [events])

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

  const handleCardClick = useCallback((event: EventEntry) => {
    setModalData(normalizeEventEntry(event))
  }, [])

  const handleModalClose = useCallback(() => {
    setModalData(null)
  }, [])

  if (events.length === 0) return null

  return (
    <UpcomingSection>
      <UpcomingTitle variant="h5">{t('upcoming.title')}</UpcomingTitle>
      <DesktopGrid>
        {events.map(event => (
          <UpcomingCard key={event.id} event={event} onClick={handleCardClick} />
        ))}
      </DesktopGrid>
      <MobileCarousel>
        <MobileCarouselTrack ref={trackRef} onScroll={handleScroll}>
          {pages.map((page, i) => (
            <MobileCarouselPage key={i}>
              {page.map(event => (
                <UpcomingCard key={event.id} event={event} onClick={handleCardClick} disableHover />
              ))}
            </MobileCarouselPage>
          ))}
        </MobileCarouselTrack>
        {pages.length > 1 && (
          <PaginationDots role="tablist" aria-label={t('upcoming.title')}>
            {pages.map((_, index) => {
              const isActive = index === activePage
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
                      handleDotClick((index + 1) % pages.length)
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      handleDotClick((index - 1 + pages.length) % pages.length)
                    }
                  }}
                  aria-label={t('pagination.go_to_page', { page: index + 1 })}
                />
              )
            })}
          </PaginationDots>
        )}
      </MobileCarousel>
      <EventDetailModal open={!!modalData} onClose={handleModalClose} data={modalData} />
    </UpcomingSection>
  )
}

export { Upcoming }

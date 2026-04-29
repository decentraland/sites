import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { expandEventOccurrences, useGetEventsQuery } from '../../../features/whats-on-events'
import type { EventEntry, EventListType } from '../../../features/whats-on-events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useEventDetailModal } from '../../../hooks/useEventDetailModal'
import { useVisibleColumnCount } from '../../../hooks/useVisibleColumnCount'
import { chunk } from '../../../utils/whatsOnChunk'
import { addDays, formatDayHeaderAria, isSameLocalDay } from '../../../utils/whatsOnDate'
import { EventDetailModal } from '../EventDetailModal'
import { HostBanner } from '../HostBanner/HostBanner'
import { UpcomingCard } from '../Upcoming/UpcomingCard'
import { AllExperiencesCard } from './AllExperiencesCard'
import { DateNavigation } from './DateNavigation'
import { DayColumn } from './DayColumn'
import { ExperiencesTabs } from './ExperiencesTabs'
import type { TabValue } from './ExperiencesTabs'
import { MyExperiencesEmptyState } from './MyExperiencesEmptyState'
import { MyExperiencesGrid } from './MyExperiencesGrid'
import { AllExperiencesSection, ColumnsContainer, MobileEventsPage, MobileEventsTrack, SectionTitle } from './AllExperiences.styled'

const MY_EXPERIENCES_PANEL_ID = 'my-experiences-panel'

interface UseAllExperiencesDataArgs {
  today: Date
  startOffset: number
  columnCount: number
  identity?: import('@dcl/crypto').AuthIdentity
  list: EventListType
  ownerOnly?: boolean
}

function useAllExperiencesData({ today, startOffset, columnCount, identity, list, ownerOnly }: UseAllExperiencesDataArgs) {
  const days = useMemo(
    () => Array.from({ length: columnCount }, (_, i) => addDays(today, startOffset + i)),
    [today, startOffset, columnCount]
  )

  // The API filters by `next_start_at`, so a recurrent event only appears in the response when the
  // upcoming occurrence falls inside `from`/`to`. To make every occurrence in `recurrent_dates`
  // visible across the calendar, drop the date range and filter on the client via expandEventOccurrences.
  const {
    data: allEvents = [],
    isLoading,
    isError
  } = useGetEventsQuery(
    {
      list,
      order: 'asc',
      world: false,
      limit: 200,
      identity,
      owner: ownerOnly ? true : undefined
    },
    { refetchOnMountOrArgChange: ownerOnly }
  )

  const expandedEvents = useMemo(() => allEvents.flatMap(event => expandEventOccurrences(event, days)), [allEvents, days])

  const dayData = useMemo(
    () =>
      days.map(day => ({
        date: day,
        events: expandedEvents
          .filter(event => isSameLocalDay(new Date(event.start_at), day))
          .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
        isLoading,
        isError
      })),
    [days, expandedEvents, isLoading, isError]
  )

  return { allEvents, dayData, isLoading }
}

function AllExperiences() {
  const { t } = useTranslation()
  const { identity, hasValidIdentity, address } = useAuthIdentity()
  const columnCount = useVisibleColumnCount()
  const [startOffset, setStartOffset] = useState(0)
  const location = useLocation()
  const requestedTab = (location.state as { activeTab?: TabValue } | null)?.activeTab
  const [activeTab, setActiveTab] = useState<TabValue>(requestedTab === 'my' ? 'my' : 'all')
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const hasScrolledToMyTab = useRef(false)
  const { closeEventDetailModal, editActiveEvent, modalData, openEventDetailModal } = useEventDetailModal()

  const [today, setToday] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })

  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (now.getTime() !== today.getTime()) {
        setToday(now)
        setStartOffset(0)
      }
    }
    document.addEventListener('visibilitychange', checkMidnight)
    return () => document.removeEventListener('visibilitychange', checkMidnight)
  }, [today])

  useEffect(() => {
    if (!hasValidIdentity && activeTab === 'my') {
      setActiveTab('all')
      setStartOffset(0)
    }
  }, [hasValidIdentity, activeTab])

  const isMyTab = hasValidIdentity && activeTab === 'my'

  const {
    allEvents,
    dayData,
    isLoading: isLoadingEvents
  } = useAllExperiencesData({
    today,
    startOffset,
    columnCount,
    identity,
    list: isMyTab ? 'all' : 'active',
    ownerOnly: isMyTab
  })

  const sortedMyEvents = useMemo(() => {
    if (!isMyTab) return []
    const lowerAddress = address?.toLowerCase() ?? ''
    if (!lowerAddress) return []
    const now = Date.now()
    return allEvents
      .filter(event => (event.user ?? '').toLowerCase() === lowerAddress)
      .map(event => {
        if (event.recurrent && event.next_start_at && event.next_finish_at) {
          /* eslint-disable @typescript-eslint/naming-convention */
          return { ...event, start_at: event.next_start_at, finish_at: event.next_finish_at }
          /* eslint-enable @typescript-eslint/naming-convention */
        }
        return event
      })
      .filter(event => new Date(event.finish_at).getTime() >= now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
  }, [address, allEvents, isMyTab])

  const hasAnyUpcomingMyEvent = sortedMyEvents.length > 0

  useEffect(() => {
    if (requestedTab !== 'my' || hasScrolledToMyTab.current || isLoadingEvents || !sectionRef.current) return

    // The section can be wrapped in an ancestor that toggles display:none while
    // sibling data loads (e.g. DeferredGroup in HomePage). scrollIntoView is a
    // no-op on elements without a layout box, so poll on rAF until the element
    // becomes visible, then scroll once. offsetParent === null here specifically
    // covers the display:none ancestor case; if DeferredGroup ever switches to
    // a position:fixed wrapper this heuristic will need to change.
    const MAX_ATTEMPTS = 120
    let rafId = 0
    let attempts = 0
    const scrollWhenVisible = () => {
      const el = sectionRef.current
      if (!el || attempts >= MAX_ATTEMPTS) return
      if (el.offsetParent === null) {
        attempts++
        rafId = requestAnimationFrame(scrollWhenVisible)
        return
      }
      hasScrolledToMyTab.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    rafId = requestAnimationFrame(scrollWhenVisible)
    return () => cancelAnimationFrame(rafId)
  }, [requestedTab, isLoadingEvents])

  const handleNavigateLeft = useCallback(() => {
    setStartOffset(prev => Math.max(0, prev - columnCount))
  }, [columnCount])

  const handleNavigateRight = useCallback(() => {
    setStartOffset(prev => prev + columnCount)
  }, [columnCount])

  const handleTabChange = useCallback((next: TabValue) => {
    setActiveTab(next)
    setStartOffset(0)
  }, [])

  const renderCard = useCallback(
    (event: EventEntry) => <AllExperiencesCard event={event} onClick={openEventDetailModal} />,
    [openEventDetailModal]
  )

  const mobilePages = useMemo(
    () =>
      chunk(
        dayData.flatMap(d => d.events),
        2
      ),
    [dayData]
  )

  const showMyEmptyState = isMyTab && Boolean(address) && !isLoadingEvents && !hasAnyUpcomingMyEvent

  return (
    <AllExperiencesSection ref={sectionRef} aria-label={t('all_hangouts.title')}>
      {hasValidIdentity ? (
        <ExperiencesTabs value={activeTab} onChange={handleTabChange} panelId={MY_EXPERIENCES_PANEL_ID} />
      ) : (
        <SectionTitle variant="h4">{t('all_hangouts.title')}</SectionTitle>
      )}
      <div role={hasValidIdentity ? 'tabpanel' : undefined} id={hasValidIdentity ? MY_EXPERIENCES_PANEL_ID : undefined}>
        {isMyTab ? (
          showMyEmptyState ? (
            <MyExperiencesEmptyState />
          ) : (
            <MyExperiencesGrid events={sortedMyEvents} onCardClick={openEventDetailModal} />
          )
        ) : (
          <>
            <DateNavigation
              startOffset={startOffset}
              columnCount={columnCount}
              today={today}
              onNavigateLeft={handleNavigateLeft}
              onNavigateRight={handleNavigateRight}
            />
            {columnCount <= 1 ? (
              <MobileEventsTrack>
                {mobilePages.map((page, i) => (
                  <MobileEventsPage key={i}>
                    {page.map(event => (
                      <UpcomingCard key={`${event.id}-${event.start_at}`} event={event} onClick={openEventDetailModal} />
                    ))}
                  </MobileEventsPage>
                ))}
              </MobileEventsTrack>
            ) : (
              <ColumnsContainer sx={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}>
                {dayData.map(({ date, events, isLoading }) => (
                  <DayColumn
                    key={date.toISOString()}
                    events={events}
                    isLoading={isLoading}
                    dateLabel={formatDayHeaderAria(date)}
                    renderCard={renderCard}
                  />
                ))}
              </ColumnsContainer>
            )}
          </>
        )}
      </div>
      <HostBanner />
      <EventDetailModal open={!!modalData} onClose={closeEventDetailModal} data={modalData} onEdit={editActiveEvent} />
    </AllExperiencesSection>
  )
}

export { AllExperiences }

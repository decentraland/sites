import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useTranslation } from '@dcl/hooks'
import { useGetAdminEventsQuery } from '../../../features/whats-on/admin/admin.client'
import { useGetEventsQuery } from '../../../features/whats-on-events'
import type { EventEntry, EventListType } from '../../../features/whats-on-events'
import { useAdminPermissions } from '../../../hooks/useAdminPermissions'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useEventDetailModal } from '../../../hooks/useEventDetailModal'
import { useVisibleColumnCount } from '../../../hooks/useVisibleColumnCount'
import { chunk } from '../../../utils/whatsOnChunk'
import { addDays, formatDayHeaderAria, getDayRange, isSameLocalDay } from '../../../utils/whatsOnDate'
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
  creator?: string
  list: EventListType
}

function useAllExperiencesData({ today, startOffset, columnCount, identity, creator, list }: UseAllExperiencesDataArgs) {
  const days = useMemo(
    () => Array.from({ length: columnCount }, (_, i) => addDays(today, startOffset + i)),
    [today, startOffset, columnCount]
  )

  const rangeStart = useMemo(() => getDayRange(days[0]), [days])
  const rangeEnd = useMemo(() => getDayRange(days[days.length - 1]), [days])

  const isCreatorScoped = Boolean(creator)
  const {
    data: allEvents = [],
    isLoading,
    isError
  } = useGetEventsQuery(
    {
      list,
      from: isCreatorScoped ? undefined : rangeStart.from,
      to: isCreatorScoped ? undefined : rangeEnd.to,
      order: 'asc',
      world: false,
      limit: 200,
      identity,
      creator
    },
    { refetchOnMountOrArgChange: isCreatorScoped }
  )

  const dayData = useMemo(
    () =>
      days.map(day => ({
        date: day,
        events: allEvents.filter(event => isSameLocalDay(new Date(event.start_at), day)),
        isLoading,
        isError
      })),
    [days, allEvents, isLoading, isError]
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
  const { isAdmin } = useAdminPermissions()

  const {
    allEvents,
    dayData,
    isLoading: isLoadingEvents
  } = useAllExperiencesData({
    today,
    startOffset,
    columnCount,
    identity,
    creator: isMyTab ? address : undefined,
    list: isMyTab ? 'all' : 'active'
  })

  const { data: adminEvents = [], isLoading: isLoadingAdminEvents } = useGetAdminEventsQuery(
    isMyTab && isAdmin && identity ? { identity } : skipToken,
    { refetchOnMountOrArgChange: true }
  )

  const sortedMyEvents = useMemo(() => {
    if (!isMyTab) return []
    const lowerAddress = address?.toLowerCase() ?? ''
    const mergedById = new Map<string, EventEntry>()
    for (const event of allEvents) mergedById.set(event.id, event)
    for (const event of adminEvents) {
      if ((event.user ?? '').toLowerCase() === lowerAddress) mergedById.set(event.id, event)
    }
    const now = Date.now()
    return Array.from(mergedById.values())
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
  }, [address, adminEvents, allEvents, isMyTab])

  const hasAnyUpcomingMyEvent = sortedMyEvents.length > 0
  const isLoadingMyEvents = isLoadingEvents || (isMyTab && isAdmin && isLoadingAdminEvents)

  useEffect(() => {
    if (requestedTab !== 'my' || hasScrolledToMyTab.current || isLoadingMyEvents || !sectionRef.current) return

    // The section can be wrapped in an ancestor that toggles display:none while
    // sibling data loads (e.g. DeferredGroup in HomePage). scrollIntoView is a
    // no-op on elements without a layout box, so poll on rAF until the element
    // becomes visible, then scroll once.
    let rafId = 0
    const scrollWhenVisible = () => {
      const el = sectionRef.current
      if (!el) return
      if (el.offsetParent === null) {
        rafId = requestAnimationFrame(scrollWhenVisible)
        return
      }
      hasScrolledToMyTab.current = true
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    rafId = requestAnimationFrame(scrollWhenVisible)
    return () => cancelAnimationFrame(rafId)
  }, [requestedTab, isLoadingMyEvents])

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

  const showMyEmptyState = isMyTab && !isLoadingMyEvents && !hasAnyUpcomingMyEvent

  return (
    <AllExperiencesSection ref={sectionRef} aria-label={t('all_experiences.title')}>
      {hasValidIdentity ? (
        <ExperiencesTabs value={activeTab} onChange={handleTabChange} panelId={MY_EXPERIENCES_PANEL_ID} />
      ) : (
        <SectionTitle variant="h4">{t('all_experiences.title')}</SectionTitle>
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
                      <UpcomingCard key={event.id} event={event} onClick={openEventDetailModal} />
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

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { useGetEventsQuery } from '../../../features/whats-on-events'
import type { EventEntry, EventListType } from '../../../features/whats-on-events'
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
  } = useGetEventsQuery({
    list,
    from: isCreatorScoped ? undefined : rangeStart.from,
    to: isCreatorScoped ? undefined : rangeEnd.to,
    order: 'asc',
    world: false,
    limit: 200,
    identity,
    creator
  })

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

  return { allEvents, dayData, totalEvents: allEvents.length, isLoading }
}

function AllExperiences() {
  const { t } = useTranslation()
  const { identity, hasValidIdentity, address } = useAuthIdentity()
  const columnCount = useVisibleColumnCount()
  const [startOffset, setStartOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<TabValue>('all')
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
    totalEvents,
    isLoading: isLoadingEvents
  } = useAllExperiencesData({
    today,
    startOffset,
    columnCount,
    identity,
    creator: isMyTab ? address : undefined,
    list: isMyTab ? 'all' : 'active'
  })

  const sortedMyEvents = useMemo(
    () => (isMyTab ? [...allEvents].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()) : []),
    [allEvents, isMyTab]
  )

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

  const showMyEmptyState = isMyTab && !isLoadingEvents && totalEvents === 0

  return (
    <AllExperiencesSection aria-label={t('all_experiences.title')}>
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

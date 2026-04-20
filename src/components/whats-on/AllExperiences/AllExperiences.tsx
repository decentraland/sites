import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { useGetEventsQuery } from '../../../features/whats-on-events'
import type { EventEntry } from '../../../features/whats-on-events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useVisibleColumnCount } from '../../../hooks/useVisibleColumnCount'
import { chunk } from '../../../utils/whatsOnChunk'
import { addDays, formatDayHeaderAria, getDayRange, isSameLocalDay } from '../../../utils/whatsOnDate'
import { EventDetailModal, normalizeEventEntry } from '../EventDetailModal'
import type { ModalEventData } from '../EventDetailModal'
import { HostBanner } from '../HostBanner/HostBanner'
import { UpcomingCard } from '../Upcoming/UpcomingCard'
import { AllExperiencesCard } from './AllExperiencesCard'
import { DateNavigation } from './DateNavigation'
import { DayColumn } from './DayColumn'
import { AllExperiencesSection, ColumnsContainer, MobileEventsPage, MobileEventsTrack, SectionTitle } from './AllExperiences.styled'

function useAllExperiencesData(today: Date, startOffset: number, columnCount: number, identity?: import('@dcl/crypto').AuthIdentity) {
  const days = useMemo(
    () => Array.from({ length: columnCount }, (_, i) => addDays(today, startOffset + i)),
    [today, startOffset, columnCount]
  )

  // Single query for the entire visible date range to avoid API rate limiting
  const rangeStart = useMemo(() => getDayRange(days[0]), [days])
  const rangeEnd = useMemo(() => getDayRange(days[days.length - 1]), [days])

  const {
    data: allEvents = [],
    isLoading,
    isError
  } = useGetEventsQuery({
    list: 'active',
    from: rangeStart.from,
    to: rangeEnd.to,
    order: 'asc',
    world: false,
    limit: 200,
    identity
  })

  // Group events by local day client-side
  return useMemo(() => {
    return days.map(day => ({
      date: day,
      events: allEvents.filter(event => isSameLocalDay(new Date(event.start_at), day)),
      isLoading,
      isError
    }))
  }, [days, allEvents, isLoading, isError])
}

function AllExperiences() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const columnCount = useVisibleColumnCount()
  const [startOffset, setStartOffset] = useState(0)
  const [modalData, setModalData] = useState<ModalEventData | null>(null)

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

  const dayData = useAllExperiencesData(today, startOffset, columnCount, identity)

  const handleNavigateLeft = useCallback(() => {
    setStartOffset(prev => Math.max(0, prev - columnCount))
  }, [columnCount])

  const handleNavigateRight = useCallback(() => {
    setStartOffset(prev => prev + columnCount)
  }, [columnCount])

  const handleCardClick = useCallback((event: EventEntry) => {
    setModalData(normalizeEventEntry(event))
  }, [])

  const handleModalClose = useCallback(() => {
    setModalData(null)
  }, [])

  const renderCard = useCallback((event: EventEntry) => <AllExperiencesCard event={event} onClick={handleCardClick} />, [handleCardClick])

  const mobilePages = useMemo(
    () =>
      chunk(
        dayData.flatMap(d => d.events),
        2
      ),
    [dayData]
  )

  return (
    <AllExperiencesSection aria-label={t('all_experiences.title')}>
      <SectionTitle variant="h4">{t('all_experiences.title')}</SectionTitle>
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
                <UpcomingCard key={event.id} event={event} onClick={handleCardClick} />
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
      <HostBanner />
      <EventDetailModal open={!!modalData} onClose={handleModalClose} data={modalData} />
    </AllExperiencesSection>
  )
}

export { AllExperiences }

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { bucketEventsByDay, useGetEventsQuery } from '../../../features/events'
import type { EventEntry, EventListType } from '../../../features/events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useEventDetailModal } from '../../../hooks/useEventDetailModal'
import { useVisibleColumnCount } from '../../../hooks/useVisibleColumnCount'
import { redirectToAuth } from '../../../utils/authRedirect'
import { addDays, formatDayHeaderAria } from '../../../utils/whatsOnDate'
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
import { AllExperiencesSection, ColumnsContainer, MobileEventCardSlot, MobileEventsList, SectionTitle } from './AllExperiences.styled'

const MY_EXPERIENCES_PANEL_ID = 'my-experiences-panel'
const TAB_QUERY_PARAM = 'tab'
const MY_TAB_PARAM_VALUE = 'my'

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
  // visible across the calendar, drop the date range and bucket on the client via bucketEventsByDay.
  const {
    data: allEvents = [],
    isLoading,
    isError
  } = useGetEventsQuery(
    {
      list,
      order: 'asc',
      // Include both Genesis City and Worlds events on BOTH tabs. Earlier this branch
      // filtered worlds out of the "All" tab because the day-column view was framed as
      // spatial (Genesis City coords). Product wants worlds visible everywhere now —
      // users were reporting "no veo mis hangouts en What's On" because their world
      // events were silently dropped.
      world: undefined,
      limit: 200,
      identity,
      owner: ownerOnly ? true : undefined
    },
    { refetchOnMountOrArgChange: ownerOnly }
  )

  const dayData = useMemo(() => {
    const buckets = bucketEventsByDay(allEvents, days)
    return days.map((day, i) => ({ date: day, events: buckets[i], isLoading, isError }))
  }, [days, allEvents, isLoading, isError])

  return { allEvents, dayData, isLoading }
}

function AllExperiences() {
  const { t } = useTranslation()
  const { identity, hasValidIdentity, address } = useAuthIdentity()
  const columnCount = useVisibleColumnCount()
  const [startOffset, setStartOffset] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: TabValue = searchParams.get(TAB_QUERY_PARAM) === MY_TAB_PARAM_VALUE ? 'my' : 'all'
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const hasScrolledToMyTab = useRef(false)
  const wasSignedInRef = useRef(false)
  const { closeEventDetailModal, editActiveEvent, modalData, openEventDetailModal } = useEventDetailModal()

  // Reset the day-window paging whenever the active tab changes — covers both click-driven
  // changes and URL-driven ones (back/forward, programmatic same-route navigation).
  useEffect(() => {
    setStartOffset(0)
  }, [activeTab])

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

  // NOTE: when the URL carries ?tab=my we behave differently depending on whether the user
  // ever held a valid identity during this session. A first-paint visit from an anonymous
  // user redirects to SSO so they land back on My after sign-in. A signed-in user who later
  // signs out gets the param stripped (graceful fall-back to All) — bouncing them to SSO
  // mid-session would be hostile UX.
  useEffect(() => {
    if (hasValidIdentity) {
      wasSignedInRef.current = true
      return
    }
    if (activeTab !== 'my') return
    if (wasSignedInRef.current) {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.delete(TAB_QUERY_PARAM)
          return next
        },
        { replace: true }
      )
      return
    }
    redirectToAuth('/whats-on', { [TAB_QUERY_PARAM]: MY_TAB_PARAM_VALUE })
  }, [hasValidIdentity, activeTab, setSearchParams])

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
    if (activeTab !== 'my' || hasScrolledToMyTab.current || isLoadingEvents || !sectionRef.current) return

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
  }, [activeTab, isLoadingEvents])

  const handleNavigateLeft = useCallback(() => {
    setStartOffset(prev => Math.max(0, prev - columnCount))
  }, [columnCount])

  const handleNavigateRight = useCallback(() => {
    setStartOffset(prev => prev + columnCount)
  }, [columnCount])

  const handleTabChange = useCallback(
    (next: TabValue) => {
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (next === 'my') nextParams.set(TAB_QUERY_PARAM, MY_TAB_PARAM_VALUE)
          else nextParams.delete(TAB_QUERY_PARAM)
          return nextParams
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const renderCard = useCallback(
    (event: EventEntry) => <AllExperiencesCard event={event} onClick={openEventDetailModal} />,
    [openEventDetailModal]
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
              <MobileEventsList>
                {dayData
                  .flatMap(d => d.events)
                  .map(event => (
                    <MobileEventCardSlot key={`${event.id}-${event.start_at}`}>
                      <UpcomingCard event={event} onClick={openEventDetailModal} />
                    </MobileEventCardSlot>
                  ))}
              </MobileEventsList>
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

import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { EventDetailModal } from '../../components/whats-on/EventDetailModal'
import { normalizeEventEntry } from '../../components/whats-on/EventDetailModal/normalizers'
import { PendingEventCard } from '../../components/whats-on/PendingEventCard'
import { useApproveEventMutation, useGetAdminEventsQuery, useRejectEventMutation } from '../../features/whats-on/admin/admin.client'
import type { EventEntry } from '../../features/whats-on-events/events.types'
import { useAdminPermissions } from '../../hooks/useAdminPermissions'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { CardGrid, EmptyStateText, PageContainer, Section, SectionSubtitle, SectionTitle } from './PendingEventsPage.styled'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function PendingEventsPage() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const { canApproveAnyEvent, canApproveOwnEvent, canEditAnyEvent, isLoading } = useAdminPermissions()
  const allowed = canApproveAnyEvent || canApproveOwnEvent || canEditAnyEvent

  const [activeEvent, setActiveEvent] = useState<EventEntry | null>(null)

  const { data: events = [], refetch } = useGetAdminEventsQuery({ identity: identity! }, { skip: !identity || !allowed })
  const [approve, { isLoading: isApproving }] = useApproveEventMutation()
  const [reject, { isLoading: isRejecting }] = useRejectEventMutation()

  const pending = useMemo(() => {
    const now = Date.now()
    return events.filter(event => {
      if (event.approved || event.rejected) return false
      const endsAt = event.finish_at ?? event.start_at
      if (!endsAt) return true
      return new Date(endsAt).getTime() > now
    })
  }, [events])

  const recentlyApproved = useMemo(() => {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS
    return events.filter(event => {
      if (!event.approved) return false
      const updatedAt = event.updated_at ? new Date(event.updated_at).getTime() : 0
      return updatedAt >= cutoff
    })
  }, [events])

  const modalData = useMemo(() => (activeEvent ? normalizeEventEntry(activeEvent) : null), [activeEvent])

  if (!isLoading && !allowed) return <Navigate to="/whats-on" replace />

  const handleApprove = async () => {
    if (!activeEvent || !identity) {
      console.error('[PendingEventsPage] approve called without identity or event')
      return
    }
    try {
      await approve({ eventId: activeEvent.id, identity }).unwrap()
      setActiveEvent(null)
      refetch()
    } catch (error) {
      console.error('[PendingEventsPage] approve failed', error)
    }
  }

  const handleReject = async () => {
    if (!activeEvent || !identity) {
      console.error('[PendingEventsPage] reject called without identity or event')
      return
    }
    try {
      await reject({ eventId: activeEvent.id, identity }).unwrap()
      setActiveEvent(null)
      refetch()
    } catch (error) {
      console.error('[PendingEventsPage] reject failed', error)
    }
  }

  const processing = isApproving || isRejecting
  const isPendingActive = activeEvent !== null && !activeEvent.approved && !activeEvent.rejected

  return (
    <PageContainer>
      <Section>
        <SectionTitle component="h1">{t('whats_on_admin.pending_events.title')}</SectionTitle>
        <CardGrid>
          {pending.length === 0 ? (
            <EmptyStateText>{t('whats_on_admin.pending_events.empty')}</EmptyStateText>
          ) : (
            pending.map(event => <PendingEventCard key={event.id} event={event} onClick={() => setActiveEvent(event)} />)
          )}
        </CardGrid>
      </Section>

      <Section>
        <SectionTitle component="h2">
          {t('whats_on_admin.pending_events.recently_approved')}
          <SectionSubtitle>{t('whats_on_admin.pending_events.recently_approved_subtitle')}</SectionSubtitle>
        </SectionTitle>
        <CardGrid>
          {recentlyApproved.map(event => (
            <PendingEventCard key={event.id} event={event} onClick={() => setActiveEvent(event)} />
          ))}
        </CardGrid>
      </Section>

      {modalData && (
        <EventDetailModal
          open
          data={modalData}
          onClose={() => setActiveEvent(null)}
          adminActions={isPendingActive ? { onApprove: handleApprove, onReject: handleReject, isProcessing: processing } : undefined}
        />
      )}
    </PageContainer>
  )
}

export { PendingEventsPage }

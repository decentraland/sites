import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useTranslation } from '@dcl/hooks'
import { Alert, Snackbar } from 'decentraland-ui2'
import { EventDetailModal } from '../../components/whats-on/EventDetailModal'
import { normalizeEventEntry } from '../../components/whats-on/EventDetailModal/normalizers'
import { PendingEventCard } from '../../components/whats-on/PendingEventCard'
import { useApproveEventMutation, useGetAdminEventsQuery, useRejectEventMutation } from '../../features/whats-on/admin/admin.client'
import type { EventEntry } from '../../features/whats-on-events/events.types'
import { useAdminPermissions } from '../../hooks/useAdminPermissions'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { AdminPageContainer } from './AdminLayout.styled'
import { CardGrid, EmptyStateText, Section, SectionSubtitle, SectionTitle } from './PendingEventsPage.styled'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function PendingEventsPage() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const { canApproveAnyEvent, canApproveOwnEvent, canEditAnyEvent, isLoading } = useAdminPermissions()
  const allowed = canApproveAnyEvent || canApproveOwnEvent || canEditAnyEvent

  const [activeEvent, setActiveEvent] = useState<EventEntry | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const { data: events = [] } = useGetAdminEventsQuery(identity && allowed ? { identity } : skipToken, { refetchOnMountOrArgChange: true })
  const [approve, { isLoading: isApproving }] = useApproveEventMutation()
  const [reject, { isLoading: isRejecting }] = useRejectEventMutation()

  const pending = useMemo(() => {
    const now = Date.now()
    return events.filter(event => !event.approved && !event.rejected && new Date(event.finish_at).getTime() > now)
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

  const handleEventAction = async (trigger: typeof approve | typeof reject, successKey: string) => {
    if (!activeEvent || !identity) {
      console.error('[PendingEventsPage] action called without identity or event')
      return
    }
    try {
      await trigger({ eventId: activeEvent.id, identity }).unwrap()
      setActiveEvent(null)
      setFeedback({ message: t(successKey), severity: 'success' })
    } catch (error) {
      console.error('[PendingEventsPage] action failed', error)
      setFeedback({ message: t('whats_on_admin.pending_events.action_error'), severity: 'error' })
    }
  }

  const handleApprove = () => handleEventAction(approve, 'whats_on_admin.pending_events.approve_success')
  const handleReject = () => handleEventAction(reject, 'whats_on_admin.pending_events.reject_success')

  const processing = isApproving || isRejecting
  const isPendingActive = activeEvent !== null && !activeEvent.approved && !activeEvent.rejected

  return (
    <AdminPageContainer>
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

      <Snackbar
        open={feedback !== null}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} variant="filled">
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </AdminPageContainer>
  )
}

export { PendingEventsPage }

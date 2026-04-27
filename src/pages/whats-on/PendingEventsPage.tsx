import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useTranslation } from '@dcl/hooks'
import { Alert, Snackbar } from 'decentraland-ui2'
import { EventDetailModal } from '../../components/whats-on/EventDetailModal'
import { PendingEventCard } from '../../components/whats-on/PendingEventCard'
import { RejectEventModal } from '../../components/whats-on/RejectEventModal'
import type { RejectSubmitPayload } from '../../components/whats-on/RejectEventModal'
import { useApproveEventMutation, useGetAdminEventsQuery, useRejectEventMutation } from '../../features/whats-on/admin'
import type { EventEntry } from '../../features/whats-on-events/events.types'
import { useAdminPermissions } from '../../hooks/useAdminPermissions'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useEventDetailModal } from '../../hooks/useEventDetailModal'
import { buildRejectionReason } from './PendingEventsPage.helpers'
import { AdminPageContainer } from './AdminLayout.styled'
import { CardGrid, EmptyStateText, Section, SectionSubtitle, SectionTitle } from './PendingEventsPage.styled'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function PendingEventsPage() {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const { canApproveAnyEvent, canApproveOwnEvent, canEditAnyEvent, isLoading } = useAdminPermissions()
  const allowed = canApproveAnyEvent || canApproveOwnEvent || canEditAnyEvent

  const [rejectingEvent, setRejectingEvent] = useState<EventEntry | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const { activeEvent, closeEventDetailModal, editActiveEvent, modalData, openEventDetailModal } = useEventDetailModal()

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

  if (!isLoading && !allowed) return <Navigate to="/whats-on" replace />

  const handleApprove = async () => {
    if (!activeEvent || !identity) {
      console.error('[PendingEventsPage] approve called without identity or event')
      return
    }
    try {
      await approve({ eventId: activeEvent.id, identity }).unwrap()
      closeEventDetailModal()
      setFeedback({ message: t('whats_on_admin.pending_events.approve_success'), severity: 'success' })
    } catch (error) {
      console.error('[PendingEventsPage] approve failed', error)
      setFeedback({ message: t('whats_on_admin.pending_events.action_error'), severity: 'error' })
    }
  }

  const handleRejectClick = () => {
    if (!activeEvent) return
    setRejectingEvent(activeEvent)
  }

  const handleRejectSubmit = async ({ reasons, notes }: RejectSubmitPayload) => {
    if (!rejectingEvent || !identity) {
      console.error('[PendingEventsPage] reject called without identity or event')
      return
    }
    const reason = buildRejectionReason(reasons, notes, t)
    try {
      await reject({ eventId: rejectingEvent.id, identity, reason }).unwrap()
      setRejectingEvent(null)
      closeEventDetailModal()
      setFeedback({ message: t('whats_on_admin.pending_events.reject_success'), severity: 'success' })
    } catch (error) {
      console.error('[PendingEventsPage] reject failed', error)
      setFeedback({ message: t('whats_on_admin.pending_events.action_error'), severity: 'error' })
    }
  }

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
            pending.map(event => <PendingEventCard key={event.id} event={event} onClick={openEventDetailModal} />)
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
            <PendingEventCard key={event.id} event={event} onClick={openEventDetailModal} />
          ))}
        </CardGrid>
      </Section>

      {modalData && (
        <EventDetailModal
          open
          data={modalData}
          onClose={closeEventDetailModal}
          adminActions={isPendingActive ? { onApprove: handleApprove, onReject: handleRejectClick, isProcessing: processing } : undefined}
          onEdit={editActiveEvent}
        />
      )}

      <RejectEventModal
        open={rejectingEvent !== null}
        isSubmitting={isRejecting}
        onClose={() => setRejectingEvent(null)}
        onSubmit={handleRejectSubmit}
      />

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

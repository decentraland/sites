import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import { useTranslation } from '@dcl/hooks'
import { Alert, AlertTitle, Snackbar } from 'decentraland-ui2'
import { CreateEventSuccess } from '../../components/events/CreateEvent/CreateEventSuccess'
import { EventForm } from '../../components/events/CreateEvent/EventForm'
import { DeleteEventModal } from '../../components/events/DeleteEventModal'
import { useGetEventByIdQuery } from '../../features/events'
import type { EventEntry } from '../../features/events'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useCanEditEvent } from '../../hooks/useCanEditEvent'
import { useDeleteHangout } from '../../hooks/useDeleteHangout'
import { getAuthSession } from '../../utils/authSession'
import { BackArrowIcon, BackButton, HeaderRow, PageBackground, PageContent, PageTitle } from './CreateEventPage.styled'

function CreateEventPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ eventId?: string }>()
  const [searchParams] = useSearchParams()
  const { address, hasValidIdentity, identity } = useAuthIdentity()
  const [submitted, setSubmitted] = useState(false)

  const navigationState = location.state as { event?: EventEntry; account?: string; session?: number } | null
  // History entries outlive account switches. Only reuse a payload from this account/session.
  const eventFromState =
    address && navigationState?.account === address.toLowerCase() && navigationState.session === getAuthSession()
      ? navigationState.event ?? null
      : null
  const isEditRoute = Boolean(params.eventId)
  const initialCommunityId = isEditRoute ? null : searchParams.get('community_id')?.trim() || null
  const initialOpenPreview = isEditRoute && searchParams.has('openPreview')
  const shouldFetchEvent = isEditRoute && hasValidIdentity && !eventFromState

  const {
    currentData: fetchedEvent,
    isFetching: isEventFetching,
    isError: isEventError
  } = useGetEventByIdQuery(shouldFetchEvent && params.eventId ? { eventId: params.eventId, identity } : skipToken)

  const initialEvent = eventFromState ?? fetchedEvent ?? null
  const { canEdit, isLoading: isPermissionsLoading } = useCanEditEvent(initialEvent?.user)

  // Delete is only reachable from the edit form (per design). After a successful delete the
  // hangout is gone, so we send the user to their My Hangouts list.
  const handleDeleted = useCallback(() => {
    navigate('/events?tab=my')
  }, [navigate])

  const { requestDelete, isConfirmOpen, isDeleting, closeConfirm, confirmDelete, feedback, clearFeedback } = useDeleteHangout({
    onDeleted: handleDeleted
  })

  const handleDeleteClick = useCallback(() => {
    if (initialEvent) requestDelete({ id: initialEvent.id, name: initialEvent.name })
  }, [initialEvent, requestDelete])

  useEffect(() => {
    if (!hasValidIdentity) {
      navigate('/events', { replace: true })
      return
    }

    if (!isEditRoute) return

    if (isEventError) {
      navigate('/events', { replace: true })
      return
    }

    if (shouldFetchEvent && isEventFetching) return

    if (!initialEvent || initialEvent.id !== params.eventId) {
      navigate('/events', { replace: true })
      return
    }

    if (!isPermissionsLoading && !canEdit) {
      navigate('/events', { replace: true })
    }
  }, [
    canEdit,
    hasValidIdentity,
    initialEvent,
    isEditRoute,
    isEventError,
    isEventFetching,
    isPermissionsLoading,
    navigate,
    params.eventId,
    shouldFetchEvent
  ])

  const handleBack = useCallback(() => {
    navigate('/events')
  }, [navigate])

  const handleSuccess = useCallback(() => {
    setSubmitted(true)
  }, [])

  if (!hasValidIdentity) return null
  if (isEditRoute && shouldFetchEvent && isEventFetching) return null
  if (isEditRoute && (!initialEvent || isPermissionsLoading || !canEdit)) return null
  if (isEditRoute && isPermissionsLoading) return null

  const titleKey = initialEvent ? 'create_event.edit_title' : 'create_event.title'

  if (submitted) {
    return (
      <>
        <PageBackground />
        <PageContent>
          <CreateEventSuccess mode={isEditRoute && initialEvent ? 'edit' : 'create'} />
        </PageContent>
      </>
    )
  }

  return (
    <>
      <PageBackground />
      <PageContent>
        <HeaderRow>
          <BackButton onClick={handleBack} aria-label={t('create_event.back')}>
            <BackArrowIcon />
          </BackButton>
          <PageTitle>{t(titleKey)}</PageTitle>
        </HeaderRow>
        <EventForm
          onCancel={handleBack}
          onSuccess={handleSuccess}
          onDelete={isEditRoute && initialEvent ? handleDeleteClick : undefined}
          initialEvent={initialEvent}
          initialCommunityId={initialCommunityId}
          initialOpenPreview={initialOpenPreview}
        />
      </PageContent>
      <DeleteEventModal open={isConfirmOpen} isSubmitting={isDeleting} onClose={closeConfirm} onConfirm={confirmDelete} />
      <Snackbar
        open={feedback !== null}
        autoHideDuration={4000}
        onClose={clearFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={clearFeedback} variant="filled">
            {feedback.title && <AlertTitle>{feedback.title}</AlertTitle>}
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  )
}

function CreateEventPage() {
  const { address } = useAuthIdentity()
  return <CreateEventPageContent key={address?.toLowerCase() ?? 'anon'} />
}

export { CreateEventPage }

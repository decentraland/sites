import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { skipToken } from '@reduxjs/toolkit/query'
import { useTranslation } from '@dcl/hooks'
import { CreateEventSuccess } from '../../components/whats-on/CreateEvent/CreateEventSuccess'
import { EventForm } from '../../components/whats-on/CreateEvent/EventForm'
import { useGetEventByIdQuery } from '../../features/whats-on-events'
import type { EventEntry } from '../../features/whats-on-events'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useCanEditEvent } from '../../hooks/useCanEditEvent'
import { BackArrowIcon, BackButton, HeaderRow, PageBackground, PageContent, PageTitle } from './CreateEventPage.styled'

function CreateEventPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ eventId?: string }>()
  const [searchParams] = useSearchParams()
  const { hasValidIdentity, identity } = useAuthIdentity()
  const [submitted, setSubmitted] = useState(false)

  const eventFromState = (location.state as { event?: EventEntry } | null)?.event ?? null
  const isEditRoute = Boolean(params.eventId)
  const initialCommunityId = isEditRoute ? null : searchParams.get('community_id')?.trim() || null
  const initialOpenPreview = isEditRoute && searchParams.has('openPreview')
  const shouldFetchEvent = isEditRoute && hasValidIdentity && !eventFromState

  const {
    data: fetchedEvent,
    isFetching: isEventFetching,
    isError: isEventError
  } = useGetEventByIdQuery(shouldFetchEvent && params.eventId ? { eventId: params.eventId, identity } : skipToken)

  const initialEvent = eventFromState ?? fetchedEvent ?? null
  const { canEdit, isLoading: isPermissionsLoading } = useCanEditEvent(initialEvent?.user)

  useEffect(() => {
    if (!hasValidIdentity) {
      navigate('/whats-on', { replace: true })
      return
    }

    if (!isEditRoute) return

    if (isEventError) {
      navigate('/whats-on', { replace: true })
      return
    }

    if (shouldFetchEvent && isEventFetching) return

    if (!initialEvent || initialEvent.id !== params.eventId) {
      navigate('/whats-on', { replace: true })
      return
    }

    if (!isPermissionsLoading && !canEdit) {
      navigate('/whats-on', { replace: true })
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
    navigate('/whats-on')
  }, [navigate])

  const handleSuccess = useCallback(() => {
    setSubmitted(true)
  }, [])

  if (!hasValidIdentity) return null
  if (isEditRoute && shouldFetchEvent && isEventFetching) return null
  if (isEditRoute && !initialEvent) return null
  if (isEditRoute && isPermissionsLoading) return null

  const titleKey = initialEvent ? 'create_event.edit_title' : 'create_event.title'

  if (submitted) {
    return (
      <>
        <PageBackground />
        <PageContent>
          <CreateEventSuccess />
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
          initialEvent={initialEvent}
          initialCommunityId={initialCommunityId}
          initialOpenPreview={initialOpenPreview}
        />
      </PageContent>
    </>
  )
}

export { CreateEventPage }

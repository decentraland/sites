import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { CreateEventSuccess } from '../../components/whats-on/CreateEvent/CreateEventSuccess'
import { EventForm } from '../../components/whats-on/CreateEvent/EventForm'
import type { EventEntry } from '../../features/whats-on-events'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useCanEditEvent } from '../../hooks/useCanEditEvent'
import { BackArrowIcon, BackButton, HeaderRow, PageBackground, PageContent, PageTitle } from './CreateEventPage.styled'

function CreateEventPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ eventId?: string }>()
  const { hasValidIdentity } = useAuthIdentity()
  const [submitted, setSubmitted] = useState(false)

  const initialEvent = (location.state as { event?: EventEntry } | null)?.event ?? null
  const isEditRoute = Boolean(params.eventId)
  const { canEdit, isLoading: isPermissionsLoading } = useCanEditEvent(initialEvent?.user)

  useEffect(() => {
    if (!hasValidIdentity) {
      navigate('/whats-on', { replace: true })
      return
    }

    if (!isEditRoute) return

    if (!initialEvent || initialEvent.id !== params.eventId) {
      navigate('/whats-on', { replace: true })
      return
    }

    if (!isPermissionsLoading && !canEdit) {
      navigate('/whats-on', { replace: true })
    }
  }, [canEdit, hasValidIdentity, initialEvent, isEditRoute, isPermissionsLoading, navigate, params.eventId])

  const handleBack = useCallback(() => {
    navigate('/whats-on')
  }, [navigate])

  const handleSuccess = useCallback(() => {
    setSubmitted(true)
  }, [])

  if (!hasValidIdentity) return null
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
        <EventForm onCancel={handleBack} onSuccess={handleSuccess} initialEvent={initialEvent} />
      </PageContent>
    </>
  )
}

export { CreateEventPage }

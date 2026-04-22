import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { CreateEventSuccess } from '../../components/whats-on/CreateEvent/CreateEventSuccess'
import { EventForm } from '../../components/whats-on/CreateEvent/EventForm'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { BackArrowIcon, BackButton, HeaderRow, PageBackground, PageContent, PageTitle } from './CreateEventPage.styled'

function CreateEventPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasValidIdentity } = useAuthIdentity()
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!hasValidIdentity) {
      navigate('/whats-on', { replace: true })
    }
  }, [hasValidIdentity, navigate])

  const handleBack = useCallback(() => {
    navigate('/whats-on')
  }, [navigate])

  const handleSuccess = useCallback(() => {
    setSubmitted(true)
  }, [])

  if (!hasValidIdentity) return null

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
          <PageTitle>{t('create_event.title')}</PageTitle>
        </HeaderRow>
        <EventForm onCancel={handleBack} onSuccess={handleSuccess} />
      </PageContent>
    </>
  )
}

export { CreateEventPage }

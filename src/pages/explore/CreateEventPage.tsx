import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { EventForm } from '../components/CreateEvent/EventForm'
import { PageLayout } from '../components/PageLayout/PageLayout'
import { useAuthIdentity } from '../hooks/useAuthIdentity'
import { BackArrowIcon, BackButton, HeaderRow, PageBackground, PageContent, PageTitle } from './CreateEventPage.styled'

function CreateEventPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasValidIdentity } = useAuthIdentity()

  useEffect(() => {
    if (!hasValidIdentity) {
      navigate('/', { replace: true })
    }
  }, [hasValidIdentity, navigate])

  const handleBack = useCallback(() => {
    navigate('/')
  }, [navigate])

  if (!hasValidIdentity) return null

  return (
    <PageLayout>
      <PageBackground />
      <PageContent>
        <HeaderRow>
          <BackButton onClick={handleBack} aria-label={t('create_event.back')}>
            <BackArrowIcon />
          </BackButton>
          <PageTitle>{t('create_event.title')}</PageTitle>
        </HeaderRow>
        <EventForm onCancel={handleBack} />
      </PageContent>
    </PageLayout>
  )
}

export { CreateEventPage }

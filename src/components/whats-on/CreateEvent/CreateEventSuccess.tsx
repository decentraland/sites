import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
import { useTranslation } from '@dcl/hooks'
import { ActionsRow, CheckCircle, PrimaryButton, SecondaryButton, SuccessContainer, SuccessMessage } from './CreateEventSuccess.styled'

function CreateEventSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleBackToExplore = useCallback(() => {
    navigate('/whats-on')
  }, [navigate])

  // TODO: route to /whats-on/my-events once that page lands; for now defaults to /whats-on
  const handleMyEvents = useCallback(() => {
    navigate('/whats-on')
  }, [navigate])

  return (
    <SuccessContainer>
      <CheckCircle>
        <CheckIcon />
      </CheckCircle>
      <SuccessMessage>{t('create_event.success_message')}</SuccessMessage>
      <ActionsRow>
        <SecondaryButton type="button" onClick={handleBackToExplore}>
          {t('create_event.back_to_explore')}
        </SecondaryButton>
        <PrimaryButton type="button" onClick={handleMyEvents}>
          {t('create_event.my_events')}
        </PrimaryButton>
      </ActionsRow>
    </SuccessContainer>
  )
}

export { CreateEventSuccess }

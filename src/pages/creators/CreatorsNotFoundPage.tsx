import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { NotFoundContainer, NotFoundDescription, NotFoundTitle } from './CreatorsNotFoundPage.styled'

function CreatorsNotFoundPage() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  return (
    <NotFoundContainer>
      <Helmet>
        <title>{t('page.creators.not_found.title')}</title>
      </Helmet>
      <NotFoundTitle>{t('page.creators.not_found.title')}</NotFoundTitle>
      <NotFoundDescription>{t('page.creators.not_found.description')}</NotFoundDescription>
      <Button variant="contained" color="primary" onClick={() => navigate('/creators')}>
        {t('page.creators.world.back')}
      </Button>
    </NotFoundContainer>
  )
}

export { CreatorsNotFoundPage }

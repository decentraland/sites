import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { NotFoundContainer } from './StorageNotFoundPage.styled'

function StorageNotFoundPage() {
  const t = useFormatMessage()

  return (
    <NotFoundContainer>
      <Helmet>
        <title>{t('page.storage.not_found.title')}</title>
      </Helmet>
      <Typography variant="h2">{t('component.storage.not_found_page.code')}</Typography>
      <Typography variant="h5">{t('component.storage.not_found_page.title')}</Typography>
      <Typography color="text.secondary">{t('component.storage.not_found_page.subtitle')}</Typography>
      <Button component={Link} to="/storage/select" variant="contained">
        {t('component.storage.not_found_page.go_home')}
      </Button>
    </NotFoundContainer>
  )
}

export { StorageNotFoundPage }

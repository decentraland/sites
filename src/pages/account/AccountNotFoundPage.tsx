import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Button, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { NotFoundContainer, NotFoundTitle } from './AccountNotFoundPage.styled'

const AccountNotFoundPage = () => {
  const t = useFormatMessage()
  return (
    <NotFoundContainer>
      <Helmet>
        <title>{`${t('account.not_found.title')} | Decentraland`}</title>
      </Helmet>
      <NotFoundTitle variant="h4">{t('account.not_found.title')}</NotFoundTitle>
      <Typography variant="body1" color="text.secondary">
        {t('account.not_found.description')}
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/account/wallets">
        {t('account.not_found.cta')}
      </Button>
    </NotFoundContainer>
  )
}

export { AccountNotFoundPage }

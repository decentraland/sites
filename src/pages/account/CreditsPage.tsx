import { Helmet } from 'react-helmet-async'
import { AccountSectionPlaceholder } from '../../components/account/AccountSectionPlaceholder/AccountSectionPlaceholder'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

const CreditsPage = () => {
  const t = useFormatMessage()
  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.credits.title')} | Decentraland`}</title>
      </Helmet>
      <AccountSectionPlaceholder title={t('account.pages.credits.title')} />
    </>
  )
}

export { CreditsPage }

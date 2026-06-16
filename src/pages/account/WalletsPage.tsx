import { Helmet } from 'react-helmet-async'
import { AccountSectionPlaceholder } from '../../components/account/AccountSectionPlaceholder/AccountSectionPlaceholder'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

const WalletsPage = () => {
  const t = useFormatMessage()
  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.wallets.title')} | Decentraland`}</title>
      </Helmet>
      <AccountSectionPlaceholder title={t('account.pages.wallets.title')} />
    </>
  )
}

export { WalletsPage }

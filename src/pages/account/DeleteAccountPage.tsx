import { Helmet } from 'react-helmet-async'
import { AccountSectionPlaceholder } from '../../components/account/AccountSectionPlaceholder/AccountSectionPlaceholder'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

const DeleteAccountPage = () => {
  const t = useFormatMessage()
  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.delete.title')} | Decentraland`}</title>
      </Helmet>
      <AccountSectionPlaceholder title={t('account.pages.delete.title')} />
    </>
  )
}

export { DeleteAccountPage }

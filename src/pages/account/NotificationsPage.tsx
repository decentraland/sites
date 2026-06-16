import { Helmet } from 'react-helmet-async'
import { AccountSectionPlaceholder } from '../../components/account/AccountSectionPlaceholder/AccountSectionPlaceholder'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

const NotificationsPage = () => {
  const t = useFormatMessage()
  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.notifications.title')} | Decentraland`}</title>
      </Helmet>
      <AccountSectionPlaceholder title={t('account.pages.notifications.title')} />
    </>
  )
}

export { NotificationsPage }

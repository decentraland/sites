import { Helmet } from 'react-helmet-async'
import { CircularProgress } from 'decentraland-ui2'
import { AccountUnavailableNotice } from '../../components/account/AccountUnavailableNotice/AccountUnavailableNotice'
import { SecuritySection } from '../../components/account/Security/SecuritySection/SecuritySection'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useCanDeleteAccount } from '../../hooks/useCanDeleteAccount'
import { LoadingState, PageRoot } from './SecurityPage.styled'

const SecurityPage = () => {
  const t = useFormatMessage()
  // Revealing a private key only applies to Magic logins; thirdweb / self-custodial wallets have no
  // Magic session to reveal. While provider detection resolves we show a loader rather than briefly
  // flashing the "unavailable" message at a Magic user. Shares the gate with the sidebar + delete page.
  const { isMagic, isResolvingProvider } = useCanDeleteAccount()

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.security.title')} | Decentraland`}</title>
      </Helmet>
      <PageRoot>
        {isMagic ? (
          <SecuritySection />
        ) : isResolvingProvider ? (
          <LoadingState data-role="security-loading">
            <CircularProgress />
          </LoadingState>
        ) : (
          <AccountUnavailableNotice
            title={t('account.security.unavailable_title')}
            description={t('account.security.unavailable_description')}
            dataRole="security-unavailable"
          />
        )}
      </PageRoot>
    </>
  )
}

export { SecurityPage }

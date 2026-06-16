import { Outlet } from 'react-router-dom'
import { Button } from 'decentraland-ui2'
import { AccountSidebar } from '../../components/account/AccountSidebar/AccountSidebar'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useSignInRedirect } from '../../hooks/useSignInRedirect'
import { AccountContent, AccountPageContainer, SignInPrompt, SignInTitle } from './AccountLayout.styled'

/**
 * Shell for the Account Settings area (absorbed from the standalone decentraland/account dapp).
 * Renders the persistent sidebar + the active section via <Outlet />. Gated on a localStorage
 * identity (no Web3 providers): unauthenticated visitors get a sign-in prompt that bounces to
 * the global SSO flow instead of a blank settings page.
 */
const AccountLayout = () => {
  const t = useFormatMessage()
  const { address } = useAuthIdentity()
  const signIn = useSignInRedirect()

  if (!address) {
    return (
      <SignInPrompt>
        <SignInTitle variant="h4">{t('account.sign_in.title')}</SignInTitle>
        <Button variant="contained" color="primary" onClick={signIn}>
          {t('account.sign_in.cta')}
        </Button>
      </SignInPrompt>
    )
  }

  return (
    <AccountPageContainer>
      <AccountSidebar address={address} />
      <AccountContent>
        <Outlet />
      </AccountContent>
    </AccountPageContainer>
  )
}

export { AccountLayout }

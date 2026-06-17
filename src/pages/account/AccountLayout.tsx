import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Button, useTheme } from 'decentraland-ui2'
import { AccountSidebar } from '../../components/account/AccountSidebar/AccountSidebar'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useSignInRedirect } from '../../hooks/useSignInRedirect'
import {
  AccountContent,
  AccountLayoutRoot,
  AccountPageContainer,
  MobileBackButton,
  MobileCloseButton,
  MobileSection,
  MobileSectionHeader,
  SignInPrompt,
  SignInTitle
} from './AccountLayout.styled'

const isIndexPath = (pathname: string): boolean => pathname === '/account' || pathname === '/account/'

// Last path segment → nav i18n key for the mobile section header ("‹ Notifications ✕").
const getSectionKey = (pathname: string): string => pathname.split('/').filter(Boolean).pop() ?? 'section_label'

/**
 * Index route element. Mobile shows the dashboard (the sidebar menu rendered by the layout), so the
 * index renders nothing; desktop has no standalone dashboard and lands on Wallets.
 */
const AccountIndexRedirect = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  return isMobile ? null : <Navigate to="/account/wallets" replace />
}

/**
 * Shell for the Account Settings area (absorbed from the standalone decentraland/account dapp).
 *
 * Desktop: a persistent left sidebar + the active section via <Outlet />.
 * Mobile (Figma 776:69124): a master-detail flow — `/account` is a full-screen dashboard (the
 * sidebar menu, each row navigating into a section), and each section is its own screen with a
 * "‹ Section ✕" header that returns to the dashboard. The sidebar and content are never stacked.
 *
 * Gated on a localStorage identity (no Web3 providers): unauthenticated visitors get a sign-in
 * prompt that bounces to the global SSO flow instead of a blank settings page.
 */
const AccountLayout = () => {
  const t = useFormatMessage()
  const theme = useTheme()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { address } = useAuthIdentity()
  const signIn = useSignInRedirect()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isIndex = isIndexPath(pathname)

  if (!address) {
    return (
      <AccountLayoutRoot>
        <SignInPrompt>
          <SignInTitle variant="h4">{t('account.sign_in.title')}</SignInTitle>
          <Button variant="contained" color="primary" onClick={signIn}>
            {t('account.sign_in.cta')}
          </Button>
        </SignInPrompt>
      </AccountLayoutRoot>
    )
  }

  if (isMobile) {
    // Dashboard: the sidebar is the whole screen; the index <Outlet /> renders nothing on mobile.
    if (isIndex) {
      return (
        <AccountLayoutRoot>
          <AccountSidebar address={address} />
          <Outlet />
        </AccountLayoutRoot>
      )
    }

    // Section detail: just the content, behind a back/close header that returns to the dashboard.
    const sectionKey = getSectionKey(pathname)
    return (
      <AccountLayoutRoot>
        <MobileSection>
          <MobileSectionHeader>
            <MobileBackButton type="button" onClick={() => navigate('/account')} data-role="account-mobile-back">
              <ArrowBackIosNewIcon fontSize="small" />
              {t(`account.nav.${sectionKey}`)}
            </MobileBackButton>
            <MobileCloseButton
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t('account.nav.close')}
              data-role="account-mobile-close"
            >
              <CloseIcon fontSize="small" />
            </MobileCloseButton>
          </MobileSectionHeader>
          <AccountContent>
            <Outlet />
          </AccountContent>
        </MobileSection>
      </AccountLayoutRoot>
    )
  }

  return (
    <AccountLayoutRoot>
      <AccountPageContainer>
        <AccountSidebar address={address} />
        <AccountContent>
          <Outlet />
        </AccountContent>
      </AccountPageContainer>
    </AccountLayoutRoot>
  )
}

export { AccountIndexRedirect, AccountLayout }

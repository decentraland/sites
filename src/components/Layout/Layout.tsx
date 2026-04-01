import { useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useWalletState } from '@dcl/core-web3/lazy'
import { usePageTracking } from '@dcl/hooks'
import type { NotificationLocale } from 'decentraland-ui2'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useLocale } from '../../intl/LocaleContext'
import { redirectToAuth } from '../../utils/authRedirect'
import { LandingFooter } from '../LandingFooter'
import { LandingNavbar } from '../LandingNavbar'
import type { LandingNavbarProps } from '../LandingNavbar'
import type { LayoutProps } from './Layout.types'

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, withNavbar = true, withFooter = true }) => {
  const location = useLocation()
  const { locale } = useLocale()
  const { address, isConnected, isConnecting, disconnect } = useWalletState()
  const { data: profile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]
  const effectivelySignedIn = isConnected || !!address
  usePageTracking(location.pathname)

  const { identity } = useAuthIdentity()

  const notificationLocale: NotificationLocale = locale === 'es' ? 'es' : locale === 'zh' ? 'zh' : 'en'
  const { notificationProps } = usePageNotifications({
    identity,
    isConnected,
    locale: notificationLocale
  })

  const handleSignIn = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search
    redirectToAuth(currentPath)
  }, [])

  const handleSignOut = useCallback(() => {
    disconnect()
  }, [disconnect])

  return (
    <div>
      {withNavbar && (
        <LandingNavbar
          isSignedIn={effectivelySignedIn}
          isSigningIn={isConnecting && !effectivelySignedIn && !!address}
          isLandingPage={location.pathname === '/'}
          address={address || undefined}
          avatar={avatar}
          notifications={notificationProps as LandingNavbarProps['notifications']}
          onClickSignIn={handleSignIn}
          onClickSignOut={handleSignOut}
        />
      )}
      {children ?? <Outlet />}
      {withFooter && <LandingFooter />}
    </div>
  )
}

export { Layout }

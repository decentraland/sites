import { Suspense, lazy, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useWalletState } from '@dcl/core-web3/lazy'
import { usePageTracking } from '@dcl/hooks'
import { DownloadModal } from 'decentraland-ui2'
import type { NotificationLocale } from 'decentraland-ui2'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import { useManaBalances } from '../../hooks/useManaBalances'
import { useLocale } from '../../intl/LocaleContext'
import { redirectToAuth } from '../../utils/authRedirect'
const LandingFooter = lazy(() => import('../LandingFooter').then(m => ({ default: m.LandingFooter })))
import { LandingNavbar } from '../LandingNavbar'
import type { LandingNavbarProps } from '../LandingNavbar'
import type { LayoutProps } from './Layout.types'
import { FooterFallback } from './Layout.styled'

// eslint-disable-next-line react/prop-types
const Layout: React.FC<LayoutProps> = ({ children, withNavbar = true, withFooter = true }) => {
  const location = useLocation()
  const { locale } = useLocale()
  const { address, isConnected, isConnecting, disconnect } = useWalletState()
  const { data: profile, isLoading: isLoadingProfile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]
  const effectivelySignedIn = isConnected || !!address
  usePageTracking(location.pathname)

  const { balances: manaBalances, isLoading: isManaLoading, fetchBalances: fetchManaBalances } = useManaBalances(address || undefined)
  const { identity } = useAuthIdentity()
  const { handleClick: handleJumpIn, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

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
          isLoadingProfile={isLoadingProfile}
          address={address || undefined}
          avatar={avatar}
          manaBalances={manaBalances}
          isManaLoading={isManaLoading}
          onOpenUserCard={fetchManaBalances}
          notifications={notificationProps as LandingNavbarProps['notifications']}
          onClickSignIn={handleSignIn}
          onClickSignOut={handleSignOut}
          onClickJumpIn={handleJumpIn}
        />
      )}
      {children ?? <Outlet />}
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
      {withFooter && (
        <Suspense fallback={<FooterFallback />}>
          <LandingFooter />
        </Suspense>
      )}
    </div>
  )
}

export { Layout }

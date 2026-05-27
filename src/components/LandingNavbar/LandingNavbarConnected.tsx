import { useCallback } from 'react'
import { DownloadModal } from 'decentraland-ui2'
import type { NotificationLocale } from 'decentraland-ui2'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import { useManaBalances } from '../../hooks/useManaBalances'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useLocale } from '../../intl/LocaleContext'
import { redirectToAuth } from '../../utils/authRedirect'
import { LandingNavbar } from './LandingNavbar'
import type { LandingNavbarProps } from './LandingNavbar'

type LandingNavbarConnectedProps = {
  isLandingPage?: boolean
}

/**
 * Wallet/profile/notifications-aware wrapper around `LandingNavbar`. Owns the
 * navbar's data dependencies (wallet, profile, MANA, notifications, hang-out
 * download modal) so any page can mount the same homepage navbar without
 * re-wiring the hooks. Consumed by `Layout` (every lightweight route) and by
 * `DownloadLayout` for the signed-in download experience.
 */
const LandingNavbarConnected = ({ isLandingPage = false }: LandingNavbarConnectedProps) => {
  const { locale } = useLocale()
  const { address, isConnected, disconnect } = useWalletAddress()
  const { data: profile, isLoading: isLoadingProfile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]
  const effectivelySignedIn = isConnected || !!address
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
    redirectToAuth(window.location.pathname + window.location.search)
  }, [])

  const handleSignOut = useCallback(() => {
    disconnect()
  }, [disconnect])

  return (
    <>
      <LandingNavbar
        isSignedIn={effectivelySignedIn}
        isLandingPage={isLandingPage}
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
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </>
  )
}

export { LandingNavbarConnected }

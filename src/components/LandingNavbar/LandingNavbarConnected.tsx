import { useCallback } from 'react'
import { DownloadModal } from 'decentraland-ui2'
import type { NotificationLocale } from 'decentraland-ui2'
import { usePageNotifications } from '../../features/notifications/usePageNotifications'
import { useGetProfileQuery } from '../../features/profile/profile.client'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useCreditsBalance } from '../../hooks/useCreditsBalance'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import { useManaBalances } from '../../hooks/useManaBalances'
import { useSignInRedirect } from '../../hooks/useSignInRedirect'
import { useWalletAddress } from '../../hooks/useWalletAddress'
import { useLocale } from '../../intl/LocaleContext'
import { LandingNavbar } from './LandingNavbar'
import type { LandingNavbarProps } from './LandingNavbar'

type LandingNavbarConnectedProps = {
  isLandingPage?: boolean
  /** /create only: switches the bar to the creators (wemotes-builder) treatment. */
  isCreatorsPage?: boolean
  /**
   * Optional override for the address whose profile/avatar/MANA the navbar should display.
   * When set, takes precedence over the wallet address resolved from localStorage.
   * Used by `DownloadLayout` to keep the navbar in sync with the page's effective profile
   * (e.g. the `?user=` param from the onboarding email flow) and to share a single
   * `useGetProfileQuery` call instead of issuing a second one for a different address.
   */
  address?: string
}

/**
 * Wallet/profile/notifications-aware wrapper around `LandingNavbar`. Owns the
 * navbar's data dependencies (wallet, profile, MANA, notifications, hang-out
 * download modal) so any page can mount the same homepage navbar without
 * re-wiring the hooks. Consumed by `Layout` (every lightweight route) and by
 * `DownloadLayout` for the signed-in download experience.
 */
const LandingNavbarConnected = ({
  isLandingPage = false,
  isCreatorsPage = false,
  address: addressOverride
}: LandingNavbarConnectedProps) => {
  const { locale } = useLocale()
  const { address: walletAddress, isConnected, disconnect } = useWalletAddress()
  const address = addressOverride ?? walletAddress
  const { data: profile, isLoading: isLoadingProfile } = useGetProfileQuery(address ?? undefined, { skip: !address })
  const avatar = profile?.avatars?.[0]
  const effectivelySignedIn = isConnected || !!address
  const { balances: manaBalances, isLoading: isManaLoading, fetchBalances: fetchManaBalances } = useManaBalances(address || undefined)
  const { identity } = useAuthIdentity()
  // The credits chip is always visible, so unlike MANA this reads on mount rather than on user-card
  // open. It no-ops without a wallet AND identity, so an anonymous visit issues no request.
  const { credits: creditsBalance } = useCreditsBalance(address || undefined, identity)
  const { handleClick: handleJumpIn, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  const notificationLocale: NotificationLocale = locale === 'es' ? 'es' : locale === 'zh' ? 'zh' : 'en'
  const { notificationProps } = usePageNotifications({
    identity,
    isConnected,
    locale: notificationLocale
  })

  const handleSignIn = useSignInRedirect()

  const handleSignOut = useCallback(() => {
    disconnect()
  }, [disconnect])

  return (
    <>
      <LandingNavbar
        isSignedIn={effectivelySignedIn}
        isLandingPage={isLandingPage}
        isCreatorsPage={isCreatorsPage}
        isLoadingProfile={isLoadingProfile}
        address={address || undefined}
        avatar={avatar}
        manaBalances={manaBalances}
        isManaLoading={isManaLoading}
        creditsBalance={creditsBalance}
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

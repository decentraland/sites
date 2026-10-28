import { useIsThirdwebAccount } from './useIsThirdwebAccount'
import { useMagicAccountStatus } from './useMagicAccountStatus'

interface CanDeleteAccount {
  /** Whether the connected account exposes the Delete Account flow (a thirdweb or Magic login). */
  canDelete: boolean
  /** Whether the deletable account is a Magic login (deleted via the auth-server) rather than thirdweb. */
  isMagic: boolean
  /**
   * Whether provider detection is still resolving (the async Magic-session check). UI should wait
   * (e.g. show a loader) rather than treat this as "cannot delete".
   */
  isResolvingProvider: boolean
}

/**
 * Whether the connected account can be deleted from the UI, and via which provider. Deletion applies
 * to web2 logins: thirdweb in-app (email / social-OTP) wallets delete client-side via the SDK, and
 * Magic logins delete via the auth-server. Self-custodial logins (MetaMask / WalletConnect) have no
 * account to delete.
 *
 * Shared by the Delete page and the account sidebar so the gating can't drift between them.
 */
function useCanDeleteAccount(): CanDeleteAccount {
  const isThirdweb = useIsThirdwebAccount()
  // Skip the Magic check (and its SDK/iframe load) for known thirdweb logins.
  const { isMagic, isLoading } = useMagicAccountStatus({ skip: isThirdweb })

  return {
    canDelete: isThirdweb || isMagic,
    isMagic,
    isResolvingProvider: !isThirdweb && isLoading
  }
}

export { useCanDeleteAccount }
export type { CanDeleteAccount }

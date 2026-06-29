import { useSyncExternalStore } from 'react'

// Magic logins persist the user's email here (see useWalletAddress). Its presence is how sites tells
// a Magic account apart from a self-custodial (MetaMask / WalletConnect) or thirdweb login. Magic
// accounts are deleted via the auth-server (DELETE /accounts), not the client-side thirdweb SDK.
const MAGIC_EMAIL_KEY = 'dcl_magic_user_email'

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

const getSnapshot = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(MAGIC_EMAIL_KEY))

/**
 * Whether the connected account is a Magic login. Reacts to cross-tab login/logout via the
 * `storage` event, mirroring {@link useIsThirdwebAccount}.
 */
function useIsMagicAccount(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export { useIsMagicAccount }

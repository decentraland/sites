import { useSyncExternalStore } from 'react'

// thirdweb in-app (email / social-OTP) logins persist the user's email here (see useWalletAddress).
// Its presence is how sites tells a thirdweb account apart from a self-custodial one (MetaMask /
// WalletConnect) or a Magic login — only thirdweb accounts can be deleted client-side via the SDK.
const THIRDWEB_EMAIL_KEY = 'dcl_thirdweb_user_email'

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

const getSnapshot = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(THIRDWEB_EMAIL_KEY))

/**
 * Whether the connected account is a thirdweb in-app wallet (email / social-OTP login). Only these
 * accounts expose the client-side deletion flow; self-custodial and Magic logins do not. Reacts to
 * cross-tab login/logout via the `storage` event.
 */
function useIsThirdwebAccount(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export { useIsThirdwebAccount }

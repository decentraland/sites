import { useState } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

type UseAuthIdentityResult = {
  identity: AuthIdentity | undefined
  hasValidIdentity: boolean
  address: `0x${string}` | undefined
}

function getIdentityFromStorage(walletAddress: string | undefined): AuthIdentity | undefined {
  if (!walletAddress) return undefined
  try {
    return localStorageGetIdentity(walletAddress.toLowerCase()) ?? undefined
  } catch (error) {
    console.error('[useAuthIdentity] Failed to get identity:', error)
    return undefined
  }
}

function useAuthIdentity(): UseAuthIdentityResult {
  const { address } = useWalletState()
  const walletAddress = address ? (address as `0x${string}`) : undefined
  const [identity] = useState<AuthIdentity | undefined>(() => getIdentityFromStorage(walletAddress))

  return {
    identity,
    hasValidIdentity: Boolean(identity),
    address: walletAddress
  }
}

export { useAuthIdentity }
export type { UseAuthIdentityResult }

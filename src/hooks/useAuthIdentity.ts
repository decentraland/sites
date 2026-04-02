import { useEffect, useState } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

type UseAuthIdentityResult = {
  identity: AuthIdentity | undefined
  hasValidIdentity: boolean
  address: `0x${string}` | undefined
  loading: boolean
}

function useAuthIdentity(): UseAuthIdentityResult {
  const { address } = useWalletState()
  const walletAddress = address ? (address as `0x${string}`) : undefined
  const [identity, setIdentity] = useState<AuthIdentity | undefined>(undefined)
  const [loading, setLoading] = useState(Boolean(walletAddress))

  useEffect(() => {
    if (!walletAddress) {
      setIdentity(undefined)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const result = localStorageGetIdentity(walletAddress.toLowerCase())
      setIdentity(result ?? undefined)
    } catch (error) {
      console.error('[useAuthIdentity] Failed to get identity:', error)
      setIdentity(undefined)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  return {
    identity,
    hasValidIdentity: Boolean(identity),
    address: walletAddress,
    loading
  }
}

export { useAuthIdentity }
export type { UseAuthIdentityResult }

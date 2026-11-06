import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { getMagicAddress } from '../../../lib/magic'

type MagicSignerState = 'ready' | 'checking' | 'connecting' | 'failed'

interface MagicSigner {
  state: MagicSignerState
  retry: () => void
}

/**
 * When the signed-in account is the Magic account, connects the Magic connector so wallet actions sign
 * with it rather than an external wallet (e.g. a leftover WalletConnect session) that wagmi reconnected.
 */
function useMagicSigner(sessionAddress: string | undefined): MagicSigner {
  const isThirdweb = useIsThirdwebAccount()
  const { address: connectedAddress, status } = useAccount()
  const { connect, connectors } = useConnect()
  // undefined until looked up; null when there is no Magic session.
  const [magicAddress, setMagicAddress] = useState<string | null | undefined>(undefined)
  const [hasFailed, setHasFailed] = useState(false)

  const session = sessionAddress?.toLowerCase()
  const isOnSessionAccount = Boolean(session) && connectedAddress?.toLowerCase() === session
  // wagmi's own reconnect may still be attaching a wallet; connecting on top of it fails as "already connected".
  const isSettling = status === 'connecting' || status === 'reconnecting'
  // Skipping the lookup when the right account is already connected keeps the Magic SDK off wallet logins.
  const needsLookup = Boolean(session) && !isThirdweb && !isOnSessionAccount && !isSettling
  const isMagic = Boolean(session) && magicAddress === session

  useEffect(() => {
    if (!needsLookup || magicAddress !== undefined) return
    let cancelled = false
    getMagicAddress().then(address => {
      if (!cancelled) setMagicAddress(address?.toLowerCase() ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [needsLookup, magicAddress])

  useEffect(() => {
    if (!isMagic || isOnSessionAccount || isSettling || hasFailed) return
    const magic = connectors.find(candidate => candidate.id === 'magic')
    if (!magic) {
      setHasFailed(true)
      return
    }
    connect(
      { connector: magic },
      {
        onError: error => {
          console.error('[useMagicSigner] Magic connect failed:', error)
          setHasFailed(true)
        }
      }
    )
  }, [isMagic, isOnSessionAccount, isSettling, hasFailed, connectors, connect])

  const retry = useCallback(() => setHasFailed(false), [])

  if (!session || isThirdweb || isOnSessionAccount) return { state: 'ready', retry }
  if (isSettling || magicAddress === undefined) return { state: 'checking', retry }
  if (!isMagic) return { state: 'ready', retry }
  return { state: hasFailed ? 'failed' : 'connecting', retry }
}

export { useMagicSigner }
export type { MagicSigner, MagicSignerState }

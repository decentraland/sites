import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect, useSwitchChain } from 'wagmi'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { getMagicAddress } from '../../../lib/magic'

type MagicSignerState = 'ready' | 'checking' | 'connecting' | 'failed'

interface MagicSigner {
  state: MagicSignerState
  retry: () => void
}

/**
 * When the signed-in account is the Magic account, connects the Magic connector on `targetChainId` so
 * wallet actions sign with it rather than an external wallet (e.g. a leftover WalletConnect session).
 */
function useMagicSigner(sessionAddress: string | undefined, targetChainId: number): MagicSigner {
  const isThirdweb = useIsThirdwebAccount()
  const { address: connectedAddress, chainId, connector, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
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
  // Magic switches networks silently, and every (re)connect resets it to the first configured chain, so
  // its users never get the manual switch step.
  const isMagicOffChain = isOnSessionAccount && connector?.id === 'magic' && chainId !== targetChainId

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
      { connector: magic, chainId: targetChainId },
      {
        onError: error => {
          console.error('[useMagicSigner] Magic connect failed:', error)
          setHasFailed(true)
        }
      }
    )
  }, [isMagic, isOnSessionAccount, isSettling, hasFailed, connectors, connect, targetChainId])

  useEffect(() => {
    if (!isMagicOffChain || isSettling || isSwitching || hasFailed) return
    switchChain(
      { chainId: targetChainId },
      {
        onError: error => {
          console.error('[useMagicSigner] Magic network switch failed:', error)
          setHasFailed(true)
        }
      }
    )
  }, [isMagicOffChain, isSettling, isSwitching, hasFailed, switchChain, targetChainId])

  const retry = useCallback(() => setHasFailed(false), [])

  if (isMagicOffChain) return { state: hasFailed ? 'failed' : 'connecting', retry }
  if (!session || isThirdweb || isOnSessionAccount) return { state: 'ready', retry }
  if (isSettling || magicAddress === undefined) return { state: 'checking', retry }
  if (!isMagic) return { state: 'ready', retry }
  return { state: hasFailed ? 'failed' : 'connecting', retry }
}

export { useMagicSigner }
export type { MagicSigner, MagicSignerState }

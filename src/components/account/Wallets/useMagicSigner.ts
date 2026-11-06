import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { getMagicAddress } from '../../../lib/magic'

type MagicSignerState = 'ready' | 'checking' | 'connecting' | 'failed' | 'mismatch'

interface MagicSigner {
  state: MagicSignerState
  retry: () => void
  disconnect: () => void
}

// A Magic iframe blocked by a privacy extension can leave the session check pending forever.
const MAGIC_LOOKUP_TIMEOUT_MS = 5000

const lookUpMagicAddress = (): Promise<string | null> =>
  Promise.race([getMagicAddress(), new Promise<null>(resolve => setTimeout(() => resolve(null), MAGIC_LOOKUP_TIMEOUT_MS))])

/**
 * When the signed-in account is the Magic account, connects the Magic connector on `targetChainId` so
 * wallet actions sign with it rather than an external wallet (e.g. a leftover WalletConnect session).
 * A connected wallet that isn't the signed-in account is reported as `mismatch` and never signs.
 */
function useMagicSigner(sessionAddress: string | undefined, targetChainId: number): MagicSigner {
  const isThirdweb = useIsThirdwebAccount()
  const { address: connectedAddress, chainId, connector, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  // Keyed by session so a lookup or failure for a previous account is never reused.
  const [lookup, setLookup] = useState<{ session: string; address: string | null } | undefined>(undefined)
  const [failedSession, setFailedSession] = useState<string | undefined>(undefined)

  const session = sessionAddress?.toLowerCase()
  const magicAddress = session && lookup?.session === session ? lookup.address : undefined
  const hasFailed = Boolean(session) && failedSession === session
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
    if (!session || !needsLookup || magicAddress !== undefined) return
    let cancelled = false
    lookUpMagicAddress().then(address => {
      if (!cancelled) setLookup({ session, address: address?.toLowerCase() ?? null })
    })
    return () => {
      cancelled = true
    }
  }, [session, needsLookup, magicAddress])

  useEffect(() => {
    if (!session || !isMagic || isOnSessionAccount || isSettling || hasFailed) return
    const magic = connectors.find(candidate => candidate.id === 'magic')
    if (!magic) {
      setFailedSession(session)
      return
    }
    connect(
      { connector: magic, chainId: targetChainId },
      {
        onError: error => {
          console.error('[useMagicSigner] Magic connect failed:', error)
          setFailedSession(session)
        }
      }
    )
  }, [session, isMagic, isOnSessionAccount, isSettling, hasFailed, connectors, connect, targetChainId])

  useEffect(() => {
    if (!session || !isMagicOffChain || isSettling || isSwitching || hasFailed) return
    switchChain(
      { chainId: targetChainId },
      {
        onError: error => {
          console.error('[useMagicSigner] Magic network switch failed:', error)
          setFailedSession(session)
        }
      }
    )
  }, [session, isMagicOffChain, isSettling, isSwitching, hasFailed, switchChain, targetChainId])

  const retry = useCallback(() => setFailedSession(undefined), [])
  const signer = (state: MagicSignerState): MagicSigner => ({ state, retry, disconnect })

  if (isMagicOffChain) return signer(hasFailed ? 'failed' : 'connecting')
  if (!session || isOnSessionAccount) return signer('ready')
  // Checked before `isSettling`: wagmi reports our own Magic connect as "connecting" too.
  if (isMagic) return signer(hasFailed ? 'failed' : 'connecting')
  if (isSettling || (!isThirdweb && magicAddress === undefined)) return signer('checking')
  return signer(isConnected ? 'mismatch' : 'ready')
}

export { useMagicSigner }
export type { MagicSigner, MagicSignerState }

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount, useConnect, useConnections, useDisconnect, useSwitchChain } from 'wagmi'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { getMagicAddress } from '../../../lib/magic'

type MagicSignerState = 'ready' | 'checking' | 'connecting' | 'failed' | 'mismatch'

interface MagicSigner {
  state: MagicSignerState
  retry: () => void
  disconnect: () => void
}

// After this, wallet users stop waiting on a slow or blocked Magic iframe; a later answer still applies.
const MAGIC_LOOKUP_TIMEOUT_MS = 5000

/**
 * When the signed-in account is the Magic account, connects the Magic connector on `targetChainId` so
 * wallet actions sign with it rather than an external wallet (e.g. a leftover WalletConnect session).
 * A connected wallet that isn't the signed-in account is reported as `mismatch` and never signs.
 */
function useMagicSigner(sessionAddress: string | undefined, targetChainId: number): MagicSigner {
  const isThirdweb = useIsThirdwebAccount()
  const { address: connectedAddress, chainId, connector, isConnected, status } = useAccount()
  const connections = useConnections()
  const { connectAsync, connectors } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const { disconnect } = useDisconnect()
  const [magicAddresses, setMagicAddresses] = useState<Record<string, string | null>>({})
  const [preparedSession, setPreparedSession] = useState<string | undefined>(undefined)
  const [failedSession, setFailedSession] = useState<string | undefined>(undefined)
  const lookupStarted = useRef<string | undefined>(undefined)
  // wagmi resets its status as soon as a connect fails, before the rejection settles; without this lock
  // that re-render would start another attempt.
  const isPreparing = useRef(false)

  const session = sessionAddress?.toLowerCase()
  const isOnSessionAccount = Boolean(session) && connectedAddress?.toLowerCase() === session
  const isSettling = status === 'connecting' || status === 'reconnecting'
  const magicAddress = session ? magicAddresses[session] : undefined
  const isMagicCurrent = isOnSessionAccount && connector?.id === 'magic'
  const isMagic = isMagicCurrent || (Boolean(session) && magicAddress === session)
  const hasFailed = Boolean(session) && failedSession === session
  // Every Magic (re)connect resets its network to the first configured chain and may keep an instance on
  // another one, so Magic is always switched once to the target chain, which silently rebuilds it.
  const needsPrepare = isMagic && (!isMagicCurrent || chainId !== targetChainId || preparedSession !== session)

  useEffect(() => {
    // Skipped when the right account is already connected, which keeps the Magic SDK off wallet logins.
    if (!session || isThirdweb || isOnSessionAccount || isSettling || lookupStarted.current === session) return
    lookupStarted.current = session
    const timeout = setTimeout(
      () => setMagicAddresses(current => (session in current ? current : { ...current, [session]: null })),
      MAGIC_LOOKUP_TIMEOUT_MS
    )
    getMagicAddress().then(address => {
      clearTimeout(timeout)
      setMagicAddresses(current => ({ ...current, [session]: address?.toLowerCase() ?? null }))
    })
  }, [session, isThirdweb, isOnSessionAccount, isSettling])

  useEffect(() => {
    if (!session || !needsPrepare || hasFailed || isSettling || isPreparing.current) return
    const magic = connectors.find(candidate => candidate.id === 'magic')
    if (!magic) {
      setFailedSession(session)
      return
    }
    isPreparing.current = true
    const prepare = async () => {
      if (!isMagicCurrent) await connectAsync({ connector: magic, chainId: targetChainId })
      await switchChainAsync({ connector: magic, chainId: targetChainId })
      setPreparedSession(session)
    }
    prepare()
      .catch(error => {
        console.error('[useMagicSigner] Magic connect failed:', error)
        setFailedSession(session)
      })
      .finally(() => {
        isPreparing.current = false
      })
  }, [session, needsPrepare, hasFailed, isSettling, isMagicCurrent, connectors, connectAsync, switchChainAsync, targetChainId])

  const retry = useCallback(() => setFailedSession(undefined), [])
  const disconnectOtherWallets = useCallback(() => {
    connections
      .filter(connection => connection.accounts[0]?.toLowerCase() !== session)
      .forEach(connection => disconnect({ connector: connection.connector }))
  }, [connections, disconnect, session])
  const signer = (state: MagicSignerState): MagicSigner => ({ state, retry, disconnect: disconnectOtherWallets })

  if (!session) return signer('ready')
  // Checked before `isSettling`: wagmi reports our own Magic connect as "connecting" too.
  if (isMagic) return signer(hasFailed ? 'failed' : needsPrepare ? 'connecting' : 'ready')
  if (isOnSessionAccount) return signer('ready')
  if (isSettling || (!isThirdweb && magicAddress === undefined)) return signer('checking')
  return signer(isConnected ? 'mismatch' : 'ready')
}

export { useMagicSigner }
export type { MagicSigner, MagicSignerState }

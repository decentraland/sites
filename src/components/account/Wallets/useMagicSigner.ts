import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useIsThirdwebAccount } from '../../../hooks/useIsThirdwebAccount'
import { useMagicAccountStatus } from '../../../hooks/useMagicAccountStatus'

type MagicSignerState = 'ready' | 'connecting' | 'failed'

/**
 * For Magic logins, connects the Magic connector so wallet actions sign with the account the user is
 * signed in with, not an external wallet (e.g. a leftover WalletConnect session) that wagmi reconnected.
 */
function useMagicSigner(): MagicSignerState {
  const isThirdweb = useIsThirdwebAccount()
  const { isMagic, isLoading } = useMagicAccountStatus({ skip: isThirdweb })
  const { connector, status } = useAccount()
  const { connect, connectors } = useConnect()
  const [hasFailed, setHasFailed] = useState(false)

  const isOnMagic = connector?.id === 'magic'
  // wagmi's own reconnect may still be attaching Magic; connecting on top of it fails as "already connected".
  const isSettling = status === 'connecting' || status === 'reconnecting'

  useEffect(() => {
    if (!isMagic || isOnMagic || isSettling || hasFailed) return
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
  }, [isMagic, isOnMagic, isSettling, hasFailed, connectors, connect])

  if (isLoading) return 'connecting'
  if (!isMagic || isOnMagic) return 'ready'
  return hasFailed ? 'failed' : 'connecting'
}

export { useMagicSigner }
export type { MagicSignerState }

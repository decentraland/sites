import { useContext } from 'react'
import { WalletStateContext } from '../providers/WalletStateProvider'
import type { WalletState } from '../providers/WalletStateProvider'

function useWalletState(): WalletState {
  return useContext(WalletStateContext)
}

export { useWalletState }

import { type PropsWithChildren, useContext, useEffect } from 'react'
import { Web3CoreProvider, Web3SyncProvider, networkReducer, transactionsReducer, useWallet, walletReducer } from '@dcl/core-web3'
import { injectWeb3Reducers } from '../app/store'
import { web3Config } from '../features/web3/web3.config'
import { WalletStateSetterContext } from './WalletStateProvider'

injectWeb3Reducers({ network: networkReducer, transactions: transactionsReducer, wallet: walletReducer })

function Web3Sync({ children }: PropsWithChildren) {
  const wallet = useWallet()
  const setWalletState = useContext(WalletStateSetterContext)

  useEffect(() => {
    setWalletState({
      address: wallet.address,
      isConnected: wallet.isConnected,
      isConnecting: wallet.isConnecting,
      isDisconnecting: wallet.isDisconnecting,
      disconnect: wallet.disconnect
    })
  }, [wallet.address, wallet.isConnected, wallet.isConnecting, wallet.isDisconnecting, wallet.disconnect, setWalletState])

  return <>{children}</>
}

function Web3Inner({ children }: PropsWithChildren) {
  return (
    <Web3CoreProvider config={web3Config}>
      <Web3SyncProvider>
        <Web3Sync>{children}</Web3Sync>
      </Web3SyncProvider>
    </Web3CoreProvider>
  )
}

export { Web3Inner }

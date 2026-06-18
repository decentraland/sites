import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { BalanceCard } from '../../components/account/Wallets/BalanceCard/BalanceCard'
import type { WalletNetwork } from '../../components/account/Wallets/manaContract'
import { ReceiveModal } from '../../components/account/Wallets/ReceiveModal/ReceiveModal'
import { SendManaModal } from '../../components/account/Wallets/SendManaModal/SendManaModal'
import { SwapManaModal } from '../../components/account/Wallets/SwapManaModal/SwapManaModal'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useManaBalances } from '../../hooks/useManaBalances'
import { useWalletTransactions } from '../../hooks/useWalletTransactions'
import { WalletsPanel } from './WalletsPage.styled'

const WalletsPage = () => {
  const t = useFormatMessage()
  const { address } = useAuthIdentity()
  const { balances, isLoading, fetchBalances } = useManaBalances(address ?? undefined)
  const { transactions } = useWalletTransactions(address ?? undefined)
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)
  const [sendNetwork, setSendNetwork] = useState<WalletNetwork | null>(null)
  const [isSwapOpen, setIsSwapOpen] = useState(false)

  const ethereumTransactions = useMemo(() => transactions.filter(transaction => transaction.network === 'ethereum'), [transactions])
  const polygonTransactions = useMemo(() => transactions.filter(transaction => transaction.network === 'polygon'), [transactions])

  // Balances are not fetched on mount by the hook (it stays out of the homepage critical path);
  // the wallets page explicitly requests them once the user lands here.
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  return (
    <>
      <Helmet>
        <title>{`${t('account.pages.wallets.title')} | Decentraland`}</title>
      </Helmet>
      <WalletsPanel data-role="wallets-panel">
        <BalanceCard
          network="ethereum"
          balance={balances?.ethereum}
          isLoading={isLoading}
          transactions={ethereumTransactions}
          onReceive={() => setIsReceiveOpen(true)}
          onSend={() => setSendNetwork('ethereum')}
          onSwap={() => setIsSwapOpen(true)}
        />
        <BalanceCard
          network="polygon"
          balance={balances?.polygon}
          isLoading={isLoading}
          transactions={polygonTransactions}
          onReceive={() => setIsReceiveOpen(true)}
          onSend={() => setSendNetwork('polygon')}
          onSwap={() => setIsSwapOpen(true)}
        />
        {/* NOTE: The transactions list shows what the user does HERE (Send/Swap), tracked client-side
            in localStorage — there is no public indexer for per-wallet MANA transfers, so received
            transfers and prior history aren't available without an external API. */}
      </WalletsPanel>
      {address ? <ReceiveModal open={isReceiveOpen} address={address} onClose={() => setIsReceiveOpen(false)} /> : null}
      <SendManaModal
        open={sendNetwork !== null}
        network={sendNetwork ?? 'ethereum'}
        address={address ?? undefined}
        onClose={() => setSendNetwork(null)}
        onSuccess={() => fetchBalances(true)}
      />
      <SwapManaModal
        open={isSwapOpen}
        balance={balances?.ethereum}
        address={address ?? undefined}
        onClose={() => setIsSwapOpen(false)}
        onSuccess={() => fetchBalances(true)}
      />
    </>
  )
}

export { WalletsPage }

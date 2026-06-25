import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { BalanceCard } from '../../components/account/Wallets/BalanceCard/BalanceCard'
import { BuyManaModal } from '../../components/account/Wallets/BuyManaModal/BuyManaModal'
import { ClaimWithdrawModal } from '../../components/account/Wallets/ClaimWithdrawModal/ClaimWithdrawModal'
import type { WalletNetwork } from '../../components/account/Wallets/manaContract'
import { ReceiveModal } from '../../components/account/Wallets/ReceiveModal/ReceiveModal'
import { SendManaModal } from '../../components/account/Wallets/SendManaModal/SendManaModal'
import { SwapManaModal } from '../../components/account/Wallets/SwapManaModal/SwapManaModal'
import { WithdrawManaModal } from '../../components/account/Wallets/WithdrawManaModal/WithdrawManaModal'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBridgeWithdrawals } from '../../hooks/useBridgeWithdrawals'
import { useManaBalances } from '../../hooks/useManaBalances'
import { useWalletHistory } from '../../hooks/useWalletHistory'
import type { WalletTransaction } from '../../hooks/useWalletTransactions.types'
import { WalletsPanel } from './WalletsPage.styled'

const WalletsPage = () => {
  const t = useFormatMessage()
  const { address } = useAuthIdentity()
  const { balances, isLoading, fetchBalances } = useManaBalances(address ?? undefined)
  const { transactions } = useWalletHistory(address ?? undefined)
  // Polls the proof API so in-flight withdrawals flip bridging→checkpoint (claimable) on their own.
  useBridgeWithdrawals(address ?? undefined)
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)
  const [sendNetwork, setSendNetwork] = useState<WalletNetwork | null>(null)
  // Buy-with-fiat modal (MoonPay / Transak): shows both networks, faithful to the account dapp.
  const [isBuyOpen, setIsBuyOpen] = useState(false)
  // Swap is directional per card: Ethereum bridges to Polygon (deposit), Polygon bridges to Ethereum
  // (withdraw). The active card's network selects which modal opens.
  const [swapNetwork, setSwapNetwork] = useState<WalletNetwork | null>(null)
  const [claimWithdrawal, setClaimWithdrawal] = useState<WalletTransaction | null>(null)

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
          onSwap={() => setSwapNetwork('ethereum')}
          onBuy={() => setIsBuyOpen(true)}
          onClaim={setClaimWithdrawal}
        />
        <BalanceCard
          network="polygon"
          balance={balances?.polygon}
          isLoading={isLoading}
          transactions={polygonTransactions}
          onReceive={() => setIsReceiveOpen(true)}
          onSend={() => setSendNetwork('polygon')}
          onSwap={() => setSwapNetwork('polygon')}
          onBuy={() => setIsBuyOpen(true)}
          onClaim={setClaimWithdrawal}
        />
        {/* The transactions list is the wallet's full MANA history from the mana-graph subgraph
            (sends, receiveds, swaps, withdraws), merged with the in-page optimistic tracking for
            just-signed Send/Swap txs. See useWalletHistory. */}
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
        open={swapNetwork === 'ethereum'}
        balance={balances?.ethereum}
        address={address ?? undefined}
        onClose={() => setSwapNetwork(null)}
        onSuccess={() => fetchBalances(true)}
      />
      <WithdrawManaModal
        open={swapNetwork === 'polygon'}
        balance={balances?.polygon}
        address={address ?? undefined}
        onClose={() => setSwapNetwork(null)}
        onSuccess={() => fetchBalances(true)}
      />
      <ClaimWithdrawModal
        withdrawal={claimWithdrawal}
        address={address ?? undefined}
        onClose={() => setClaimWithdrawal(null)}
        onSuccess={() => fetchBalances(true)}
      />
      <BuyManaModal open={isBuyOpen} address={address ?? undefined} onClose={() => setIsBuyOpen(false)} />
    </>
  )
}

export { WalletsPage }

import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { BalanceCard } from '../../components/account/Wallets/BalanceCard/BalanceCard'
import { ReceiveModal } from '../../components/account/Wallets/ReceiveModal/ReceiveModal'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useManaBalances } from '../../hooks/useManaBalances'
import { WalletsPanel } from './WalletsPage.styled'

const WalletsPage = () => {
  const t = useFormatMessage()
  const { address } = useAuthIdentity()
  const { balances, isLoading, fetchBalances } = useManaBalances(address ?? undefined)
  const [isReceiveOpen, setIsReceiveOpen] = useState(false)

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
        <BalanceCard network="ethereum" balance={balances?.ethereum} isLoading={isLoading} onReceive={() => setIsReceiveOpen(true)} />
        <BalanceCard network="polygon" balance={balances?.polygon} isLoading={isLoading} onReceive={() => setIsReceiveOpen(true)} />
        {/* NOTE: The transactions list (Figma 322:101467) is deferred. The standalone account dapp
            built it from client-side Redux (deposits/withdrawals/transfers tracked locally); there
            is no public read-only MANA transaction-history API to source it from in sites, so it is
            left out rather than faked. Revisit once a data source exists. */}
      </WalletsPanel>
      {address ? <ReceiveModal open={isReceiveOpen} address={address} onClose={() => setIsReceiveOpen(false)} /> : null}
    </>
  )
}

export { WalletsPage }

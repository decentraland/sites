// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import { useAnalytics } from '@dcl/hooks'
import { Skeleton } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { SegmentEvent } from '../../../../modules/segment'
import { ManaEthIcon, ManaMaticIcon } from '../../../LandingNavbar/icons'
import { ManaMarkIcon } from '../ManaMarkIcon'
import { TransactionsSection } from '../TransactionsSection/TransactionsSection'
import { formatMana } from '../wallets.helpers'
import {
  ActionButton,
  Actions,
  BalanceAmount,
  BalanceInfo,
  BalanceRow,
  Card,
  CardTop,
  NetworkLabel,
  NetworkRow
} from './BalanceCard.styled'

type WalletNetwork = 'ethereum' | 'polygon'

interface BalanceCardProps {
  network: WalletNetwork
  balance: number | undefined
  isLoading: boolean
  transactions: WalletTransaction[]
  onReceive: () => void
  onSend: () => void
  onSwap: () => void
  // Opens the Buy-with-fiat modal (MoonPay / Transak) for this card's network.
  onBuy: () => void
  // Opens the exit (claim on Ethereum) flow for a checkpointed withdrawal in this card's list.
  onClaim?: (withdrawal: WalletTransaction) => void
}

const BalanceCard = ({ network, balance, isLoading, transactions, onReceive, onSend, onSwap, onBuy, onClaim }: BalanceCardProps) => {
  const t = useFormatMessage()
  const { track, isInitialized } = useAnalytics()

  const label = network === 'ethereum' ? t('account.wallets.eth_label') : t('account.wallets.polygon_label')

  const trackAction = (action: string) => {
    if (isInitialized) track(SegmentEvent.CLICK, { place: 'Account - Wallets', network, action })
  }

  const handleBuy = () => {
    trackAction('buy')
    onBuy()
  }
  const handleSwap = () => {
    trackAction('swap')
    onSwap()
  }
  const handleSend = () => {
    trackAction('send')
    onSend()
  }
  const handleReceive = () => {
    trackAction('receive')
    onReceive()
  }

  return (
    <Card data-role="balance-card">
      <CardTop>
        <BalanceInfo>
          <NetworkRow>
            {network === 'ethereum' ? <ManaEthIcon /> : <ManaMaticIcon />}
            <NetworkLabel>{label}</NetworkLabel>
          </NetworkRow>
          {isLoading || balance === undefined ? (
            <Skeleton variant="text" width={140} height={40} />
          ) : (
            <BalanceRow>
              <ManaMarkIcon />
              <BalanceAmount data-role="balance-amount">{formatMana(balance)}</BalanceAmount>
            </BalanceRow>
          )}
        </BalanceInfo>
        <Actions>
          <ActionButton type="button" onClick={handleBuy} data-role="wallet-action-buy">
            <AttachMoneyRoundedIcon fontSize="small" />
            {t('account.wallets.actions.buy')}
          </ActionButton>
          <ActionButton type="button" onClick={handleSwap} data-role="wallet-action-swap">
            <SwapHorizRoundedIcon fontSize="small" />
            {t('account.wallets.actions.swap')}
          </ActionButton>
          <ActionButton type="button" onClick={handleSend} data-role="wallet-action-send">
            <ArrowUpwardRoundedIcon fontSize="small" />
            {t('account.wallets.actions.send')}
          </ActionButton>
          <ActionButton type="button" onClick={handleReceive} data-role="wallet-action-receive">
            <ArrowDownwardRoundedIcon fontSize="small" />
            {t('account.wallets.actions.receive')}
          </ActionButton>
        </Actions>
      </CardTop>
      <TransactionsSection transactions={transactions} onClaim={onClaim} />
    </Card>
  )
}

export { BalanceCard }
export type { WalletNetwork }

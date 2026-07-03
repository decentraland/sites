import { type MouseEvent, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MoreVertIcon from '@mui/icons-material/MoreVert'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import { useAnalytics } from '@dcl/hooks'
import { Network } from '@dcl/schemas'
import { Mana, Menu, Skeleton } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { SegmentEvent } from '../../../../modules/segment'
import type { WalletNetwork } from '../manaContract'
import { NetworkIcon } from '../NetworkIcon'
import { TransactionsSection } from '../TransactionsSection/TransactionsSection'
import { formatMana } from '../wallets.helpers'
import {
  ActionButton,
  Actions,
  BalanceInfo,
  BalanceRow,
  Card,
  CardTop,
  MoreActionsButton,
  MoreMenuItem,
  NetworkLabel,
  NetworkRow
} from './BalanceCard.styled'

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
  // Anchors the mobile/tablet "more actions" menu that surfaces Send/Receive below the desktop
  // breakpoint (Figma mobile spec, issue #640).
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null)
  const closeMoreMenu = () => setMoreMenuAnchor(null)

  const label = network === 'ethereum' ? t('account.wallets.eth_label') : t('account.wallets.polygon_label')
  // Network-aware MANA mark (Ethereum vs Matic) reused from decentraland-ui2 so the balance matches
  // the design system instead of the compact navbar marks (issue #637).
  const manaNetwork = network === 'ethereum' ? Network.ETHEREUM : Network.MATIC

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
    closeMoreMenu()
    trackAction('send')
    onSend()
  }
  const handleReceive = () => {
    closeMoreMenu()
    trackAction('receive')
    onReceive()
  }

  return (
    <Card data-role="balance-card">
      <CardTop>
        <BalanceInfo>
          <NetworkRow>
            <NetworkIcon network={network} />
            <NetworkLabel>{label}</NetworkLabel>
          </NetworkRow>
          {isLoading || balance === undefined ? (
            <Skeleton variant="text" width={140} height={40} />
          ) : (
            <BalanceRow data-role="balance-amount">
              {/* Ethereum MANA renders in the brand pink; Polygon MANA stays white per the design. */}
              <Mana network={manaNetwork} primary={network === 'ethereum'} size="large">
                {formatMana(balance)}
              </Mana>
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
          <ActionButton type="button" $desktopOnly onClick={handleSend} data-role="wallet-action-send">
            <ArrowUpwardRoundedIcon fontSize="small" />
            {t('account.wallets.actions.send')}
          </ActionButton>
          <ActionButton type="button" $desktopOnly onClick={handleReceive} data-role="wallet-action-receive">
            <ArrowDownwardRoundedIcon fontSize="small" />
            {t('account.wallets.actions.receive')}
          </ActionButton>
          <MoreActionsButton
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) => setMoreMenuAnchor(event.currentTarget)}
            aria-label={t('account.wallets.actions.more')}
            aria-haspopup="true"
            aria-expanded={Boolean(moreMenuAnchor)}
            data-role="wallet-action-more"
          >
            <MoreVertIcon fontSize="small" />
          </MoreActionsButton>
          <Menu anchorEl={moreMenuAnchor} open={Boolean(moreMenuAnchor)} onClose={closeMoreMenu}>
            <MoreMenuItem onClick={handleSend} data-role="wallet-action-send-menu-item">
              <ArrowUpwardRoundedIcon fontSize="small" />
              {t('account.wallets.actions.send')}
            </MoreMenuItem>
            <MoreMenuItem onClick={handleReceive} data-role="wallet-action-receive-menu-item">
              <ArrowDownwardRoundedIcon fontSize="small" />
              {t('account.wallets.actions.receive')}
            </MoreMenuItem>
          </Menu>
        </Actions>
      </CardTop>
      <TransactionsSection transactions={transactions} onClaim={onClaim} />
    </Card>
  )
}

export { BalanceCard }

// eslint-disable-next-line @typescript-eslint/naming-convention
import AddRoundedIcon from '@mui/icons-material/AddRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import { useAnalytics } from '@dcl/hooks'
import { Skeleton } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { SegmentEvent } from '../../../../modules/segment'
import { ManaEthIcon, ManaMaticIcon } from '../../../LandingNavbar/icons'
import { buildBuyManaUrl, buildSwapManaUrl, formatMana } from '../wallets.helpers'
import { ActionButton, Actions, BalanceAmount, BalanceInfo, Card, NetworkLabel, NetworkRow } from './BalanceCard.styled'

type WalletNetwork = 'ethereum' | 'polygon'

interface BalanceCardProps {
  network: WalletNetwork
  balance: number | undefined
  isLoading: boolean
  onReceive: () => void
  onSend: () => void
}

const openExternal = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

const BalanceCard = ({ network, balance, isLoading, onReceive, onSend }: BalanceCardProps) => {
  const t = useFormatMessage()
  const { track, isInitialized } = useAnalytics()

  const label = network === 'ethereum' ? t('account.wallets.eth_label') : t('account.wallets.polygon_label')

  const trackAction = (action: string) => {
    if (isInitialized) track(SegmentEvent.CLICK, { place: 'Account - Wallets', network, action })
  }

  const handleBuy = () => {
    trackAction('buy')
    openExternal(buildBuyManaUrl())
  }
  const handleSwap = () => {
    trackAction('swap')
    openExternal(buildSwapManaUrl())
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
      <BalanceInfo>
        <NetworkRow>
          {network === 'ethereum' ? <ManaEthIcon /> : <ManaMaticIcon />}
          <NetworkLabel>{label}</NetworkLabel>
        </NetworkRow>
        {isLoading || balance === undefined ? (
          <Skeleton variant="text" width={140} height={40} />
        ) : (
          <BalanceAmount data-role="balance-amount">{formatMana(balance)}</BalanceAmount>
        )}
      </BalanceInfo>
      <Actions>
        <ActionButton type="button" onClick={handleBuy} data-role="wallet-action-buy">
          <AddRoundedIcon fontSize="small" />
          {t('account.wallets.actions.buy')}
        </ActionButton>
        <ActionButton type="button" onClick={handleSwap} data-role="wallet-action-swap">
          <SwapHorizRoundedIcon fontSize="small" />
          {t('account.wallets.actions.swap')}
        </ActionButton>
        <ActionButton type="button" onClick={handleSend} data-role="wallet-action-send">
          <NorthEastRoundedIcon fontSize="small" />
          {t('account.wallets.actions.send')}
        </ActionButton>
        <ActionButton type="button" onClick={handleReceive} data-role="wallet-action-receive">
          <QrCode2RoundedIcon fontSize="small" />
          {t('account.wallets.actions.receive')}
        </ActionButton>
      </Actions>
    </Card>
  )
}

export { BalanceCard }
export type { WalletNetwork }

import { useState } from 'react'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { fetchTransakUrl, getMoonPayUrl } from '../buyMana.helpers'
import type { BuyManaProvider } from '../buyMana.helpers'
import type { WalletNetwork } from '../manaContract'
import { Body, StateText } from '../SendManaModal/SendManaModal.styled'
import {
  GatewayCard,
  GatewaySubtitle,
  GatewayTitle,
  LearnMore,
  NetworkDescription,
  NetworkLabel,
  NetworkSection,
  Subtitle
} from './BuyManaModal.styled'

interface BuyManaContentProps {
  address: string | undefined
  onClose: () => void
}

// One section per network, with its gateways — faithful to the account dapp. MoonPay only supports
// Ethereum MANA; Transak supports both.
const NETWORKS: { id: WalletNetwork; gateways: BuyManaProvider[] }[] = [
  { id: 'ethereum', gateways: ['moonpay', 'transak'] },
  { id: 'polygon', gateways: ['transak'] }
]

const LEARN_MORE: Record<BuyManaProvider, string> = {
  moonpay: 'https://www.moonpay.com/',
  transak: 'https://transak.com/'
}

const BuyManaContent = ({ address, onClose }: BuyManaContentProps) => {
  const t = useFormatMessage()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const handleContinue = async (network: WalletNetwork, provider: BuyManaProvider): Promise<void> => {
    if (!address) return
    setErrorKey(null)

    // MoonPay hosted checkout: synchronous window.open inside the click — never popup-blocked.
    if (provider === 'moonpay') {
      window.open(getMoonPayUrl(address), '_blank', 'noopener,noreferrer')
      onClose()
      return
    }

    // Transak: open the tab synchronously (within the click), then point it at the fetched session URL
    // once it resolves, so the popup blocker doesn't kill it. `opener = null` mitigates tab-nabbing.
    const tab = window.open('about:blank', '_blank')
    setLoadingKey(`${network}-${provider}`)
    try {
      const url = await fetchTransakUrl(network, address)
      if (tab) {
        tab.opener = null
        tab.location.href = url
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      onClose()
    } catch {
      // Rule 10: never surface the raw error — show a stable message.
      tab?.close()
      setErrorKey('account.wallets.buy.error')
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <Body data-role="buy-form">
      <Subtitle>{t('account.wallets.buy.subtitle')}</Subtitle>
      {NETWORKS.map(({ id, gateways }) => {
        const networkName = t(`account.wallets.buy.network.${id}.name`)
        return (
          <NetworkSection key={id} data-role={`buy-network-${id}`}>
            <NetworkLabel>{t(`account.wallets.buy.network.${id}.label`)}</NetworkLabel>
            <NetworkDescription>{t(`account.wallets.buy.network.${id}.description`)}</NetworkDescription>
            {gateways.map(provider => {
              const providerName = t(`account.wallets.buy.provider.${provider}`)
              const key = `${id}-${provider}`
              return (
                <GatewayCard key={provider} data-role={`buy-gateway-${key}`}>
                  <GatewayTitle>{t('account.wallets.buy.provider_title', { network: networkName, provider: providerName })}</GatewayTitle>
                  <GatewaySubtitle>{t('account.wallets.buy.provider_subtitle')}</GatewaySubtitle>
                  <LearnMore href={LEARN_MORE[provider]} target="_blank" rel="noopener noreferrer">
                    {t('account.wallets.buy.learn_more', { provider: providerName })}
                  </LearnMore>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loadingKey !== null}
                    onClick={() => void handleContinue(id, provider)}
                    data-role={`buy-continue-${key}`}
                  >
                    {loadingKey === key ? t('account.wallets.buy.loading') : t('account.wallets.buy.continue', { provider: providerName })}
                  </Button>
                </GatewayCard>
              )
            })}
          </NetworkSection>
        )
      })}
      {errorKey && <StateText $error>{t(errorKey)}</StateText>}
    </Body>
  )
}

export { BuyManaContent }

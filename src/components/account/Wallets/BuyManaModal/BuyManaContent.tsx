import { useState } from 'react'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import transakLogo from '../../../../images/account/transak.svg'
import { fetchTransakUrl, getMoonPayUrl } from '../buyMana.helpers'
import type { BuyManaProvider } from '../buyMana.helpers'
import type { WalletNetwork } from '../manaContract'
import { Body, StateText } from '../SendManaModal/SendManaModal.styled'
import {
  GatewayCard,
  GatewayLogo,
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
  network: WalletNetwork
  onClose: () => void
}

// One section per network, with its gateways — faithful to the account dapp. MoonPay only supports
// Ethereum MANA; Transak supports both.
const NETWORKS: { id: WalletNetwork; gateways: BuyManaProvider[] }[] = [
  { id: 'ethereum', gateways: ['moonpay', 'transak'] },
  { id: 'polygon', gateways: ['transak'] }
]

// NOTE (2026-06-29): MoonPay is temporarily hidden — its hosted checkout is not working. The gateway
// wiring (NETWORKS above), the `handleContinue` branch, the `getMoonPayUrl` helper, the MOON_PAY_* env
// vars and the i18n are all kept intact, so re-enabling is a one-line revert: empty this list.
const HIDDEN_PROVIDERS: BuyManaProvider[] = ['moonpay']

const LEARN_MORE: Record<BuyManaProvider, string> = {
  moonpay: 'https://www.moonpay.com/',
  transak: 'https://transak.com/'
}

// Provider brand banner shown atop each gateway card (the same logo the standalone account dapp shows).
// MoonPay's banner is intentionally absent while MoonPay is hidden (see HIDDEN_PROVIDERS) — add its asset
// here when re-enabling it.
const GATEWAY_LOGO: Partial<Record<BuyManaProvider, string>> = {
  transak: transakLogo
}

const BuyManaContent = ({ address, network, onClose }: BuyManaContentProps) => {
  const t = useFormatMessage()
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const handleContinue = async (network: WalletNetwork, provider: BuyManaProvider): Promise<void> => {
    if (!address) return
    setErrorKey(null)

    // MoonPay hosted checkout: synchronous window.open inside the click — never popup-blocked.
    /* istanbul ignore next -- MoonPay is temporarily hidden via HIDDEN_PROVIDERS, so this branch is
       unreachable from the UI right now; it is kept intact for the one-line re-enable. */
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
      {NETWORKS.filter(({ id }) => id === network).map(({ id, gateways }) => {
        const networkName = t(`account.wallets.buy.network.${id}.name`)
        return (
          <NetworkSection key={id} data-role={`buy-network-${id}`}>
            <NetworkLabel>{t(`account.wallets.buy.network.${id}.label`)}</NetworkLabel>
            <NetworkDescription>{t(`account.wallets.buy.network.${id}.description`)}</NetworkDescription>
            {gateways
              .filter(provider => !HIDDEN_PROVIDERS.includes(provider))
              .map(provider => {
                const providerName = t(`account.wallets.buy.provider.${provider}`)
                const key = `${id}-${provider}`
                return (
                  <GatewayCard key={provider} data-role={`buy-gateway-${key}`}>
                    {GATEWAY_LOGO[provider] ? (
                      <GatewayLogo src={GATEWAY_LOGO[provider]} alt={providerName} data-role={`buy-logo-${key}`} />
                    ) : null}
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
                      {loadingKey === key
                        ? t('account.wallets.buy.loading')
                        : t('account.wallets.buy.continue', { provider: providerName })}
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

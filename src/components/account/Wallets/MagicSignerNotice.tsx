import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Body, Description, StateText } from './SendManaModal/SendManaModal.styled'
import type { MagicSignerState } from './useMagicSigner'

interface MagicSignerNoticeProps {
  state: Exclude<MagicSignerState, 'ready'>
  onRetry: () => void
}

const MagicSignerNotice = ({ state, onRetry }: MagicSignerNoticeProps) => {
  const t = useFormatMessage()

  if (state === 'failed') {
    return (
      <Body data-role="magic-signer-failed">
        <StateText $error>{t('account.wallets.magic_signer.failed')}</StateText>
        <Button variant="outlined" color="primary" fullWidth onClick={onRetry} data-role="magic-signer-retry">
          {t('account.wallets.magic_signer.retry')}
        </Button>
      </Body>
    )
  }

  return (
    <Body data-role={`magic-signer-${state}`}>
      <Description>{t(`account.wallets.magic_signer.${state}`)}</Description>
    </Body>
  )
}

export { MagicSignerNotice }

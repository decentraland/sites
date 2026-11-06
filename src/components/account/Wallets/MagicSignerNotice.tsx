import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Body, Description, StateText } from './SendManaModal/SendManaModal.styled'
import type { MagicSigner } from './useMagicSigner'

interface MagicSignerNoticeProps {
  signer: MagicSigner
}

const MagicSignerNotice = ({ signer }: MagicSignerNoticeProps) => {
  const t = useFormatMessage()
  const { state } = signer

  if (state === 'failed' || state === 'mismatch') {
    const isFailed = state === 'failed'
    return (
      <Body data-role={`magic-signer-${state}`}>
        <StateText $error>{t(`account.wallets.magic_signer.${state}`)}</StateText>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => (isFailed ? signer.retry() : signer.disconnect())}
          data-role={isFailed ? 'magic-signer-retry' : 'magic-signer-disconnect'}
        >
          {t(isFailed ? 'account.wallets.magic_signer.retry' : 'account.wallets.magic_signer.disconnect')}
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

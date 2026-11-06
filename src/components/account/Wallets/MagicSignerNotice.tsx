import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Body, Description, StateText } from './SendManaModal/SendManaModal.styled'
import type { MagicSignerState } from './useMagicSigner'

interface MagicSignerNoticeProps {
  state: Exclude<MagicSignerState, 'ready'>
}

const MagicSignerNotice = ({ state }: MagicSignerNoticeProps) => {
  const t = useFormatMessage()
  return (
    <Body data-role={`magic-signer-${state}`}>
      {state === 'failed' ? (
        <StateText $error>{t('account.wallets.magic_signer.failed')}</StateText>
      ) : (
        <Description>{t('account.wallets.magic_signer.connecting')}</Description>
      )}
    </Body>
  )
}

export { MagicSignerNotice }

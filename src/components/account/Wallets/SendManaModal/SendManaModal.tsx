// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { CircularProgress } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { BlockchainShell } from '../../../../shells/BlockchainShell'
import type { WalletNetwork } from '../manaContract'
import { SendManaContent } from './SendManaContent'
import { Centered, CloseButton, Header, StateText, StyledDialog, Title } from './SendManaModal.styled'

interface SendManaModalProps {
  open: boolean
  network: WalletNetwork
  onClose: () => void
}

const SendManaModal = ({ open, network, onClose }: SendManaModalProps) => {
  const t = useFormatMessage()

  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="account-send-title">
      <Header>
        <Title id="account-send-title" variant="h5">
          {t('account.wallets.send.title')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.wallets.send.close')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      {/* Mount the lazy Web3 shell only while open so wagmi/viem/magic load on first Send, not on page view. */}
      {open && (
        <BlockchainShell
          fallback={
            <Centered data-role="send-loading">
              <CircularProgress color="inherit" size={28} />
              <StateText>{t('account.wallets.send.loading')}</StateText>
            </Centered>
          }
        >
          <SendManaContent network={network} onClose={onClose} />
        </BlockchainShell>
      )}
    </StyledDialog>
  )
}

export { SendManaModal }

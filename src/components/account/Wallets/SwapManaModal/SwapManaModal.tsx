// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { CircularProgress } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { BlockchainShell } from '../../../../shells/BlockchainShell'
import { Centered, CloseButton, Header, StateText, StyledDialog, Title } from '../SendManaModal/SendManaModal.styled'
import { SwapManaContent } from './SwapManaContent'

interface SwapManaModalProps {
  open: boolean
  balance: number | undefined
  onClose: () => void
  onSuccess?: () => void
}

const SwapManaModal = ({ open, balance, onClose, onSuccess }: SwapManaModalProps) => {
  const t = useFormatMessage()

  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="account-swap-title">
      <Header>
        <Title id="account-swap-title" variant="h5">
          {t('account.wallets.swap.title')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.wallets.swap.close')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      {/* Mount the lazy Web3 shell only while open so wagmi/viem/magic load on first Swap. */}
      {open && (
        <BlockchainShell
          fallback={
            <Centered data-role="swap-loading">
              <CircularProgress color="inherit" size={28} />
              <StateText>{t('account.wallets.swap.loading')}</StateText>
            </Centered>
          }
        >
          <SwapManaContent balance={balance} onClose={onClose} onSuccess={onSuccess} />
        </BlockchainShell>
      )}
    </StyledDialog>
  )
}

export { SwapManaModal }

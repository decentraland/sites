// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { CircularProgress } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import type { WalletTransaction } from '../../../../hooks/useWalletTransactions.types'
import { BlockchainShell } from '../../../../shells/BlockchainShell'
import { Centered, CloseButton, Header, StateText, StyledDialog, Title } from '../SendManaModal/SendManaModal.styled'
import { ClaimWithdrawContent } from './ClaimWithdrawContent'

interface ClaimWithdrawModalProps {
  // The checkpointed withdrawal being claimed; null keeps the modal closed.
  withdrawal: WalletTransaction | null
  address: string | undefined
  onClose: () => void
  onSuccess?: () => void
}

const ClaimWithdrawModal = ({ withdrawal, address, onClose, onSuccess }: ClaimWithdrawModalProps) => {
  const t = useFormatMessage()

  return (
    <StyledDialog open={withdrawal !== null} onClose={onClose} aria-labelledby="account-claim-title">
      <Header>
        <Title id="account-claim-title" variant="h5">
          {t('account.wallets.claim.title')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.wallets.claim.close')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      {/* Mount the lazy Web3 shell only while open so wagmi/viem/magic load on first claim. */}
      {withdrawal && (
        <BlockchainShell
          fallback={
            <Centered data-role="claim-loading">
              <CircularProgress color="inherit" size={28} />
              <StateText>{t('account.wallets.claim.loading')}</StateText>
            </Centered>
          }
        >
          <ClaimWithdrawContent withdrawal={withdrawal} address={address} onClose={onClose} onSuccess={onSuccess} />
        </BlockchainShell>
      )}
    </StyledDialog>
  )
}

export { ClaimWithdrawModal }

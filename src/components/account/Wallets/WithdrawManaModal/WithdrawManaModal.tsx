// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { CircularProgress } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { BlockchainShell } from '../../../../shells/BlockchainShell'
import { Centered, CloseButton, Header, StateText, StyledDialog, Title } from '../SendManaModal/SendManaModal.styled'
import { WithdrawManaContent } from './WithdrawManaContent'

interface WithdrawManaModalProps {
  open: boolean
  balance: number | undefined
  address: string | undefined
  onClose: () => void
  onSuccess?: () => void
}

const WithdrawManaModal = ({ open, balance, address, onClose, onSuccess }: WithdrawManaModalProps) => {
  const t = useFormatMessage()

  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="account-withdraw-title">
      <Header>
        <Title id="account-withdraw-title" variant="h5">
          {t('account.wallets.withdraw.title')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.wallets.withdraw.close')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      {/* Mount the lazy Web3 shell only while open so wagmi/viem/magic load on first Withdraw. */}
      {open && (
        <BlockchainShell
          fallback={
            <Centered data-role="withdraw-loading">
              <CircularProgress color="inherit" size={28} />
              <StateText>{t('account.wallets.withdraw.loading')}</StateText>
            </Centered>
          }
        >
          <WithdrawManaContent balance={balance} address={address} onClose={onClose} onSuccess={onSuccess} />
        </BlockchainShell>
      )}
    </StyledDialog>
  )
}

export { WithdrawManaModal }

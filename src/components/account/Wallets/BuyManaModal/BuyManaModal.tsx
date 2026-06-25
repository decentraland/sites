// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { CloseButton, Header, StyledDialog, Title } from '../SendManaModal/SendManaModal.styled'
import { BuyManaContent } from './BuyManaContent'

interface BuyManaModalProps {
  open: boolean
  address: string | undefined
  onClose: () => void
}

const BuyManaModal = ({ open, address, onClose }: BuyManaModalProps) => {
  const t = useFormatMessage()

  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="account-buy-title">
      <Header>
        <Title id="account-buy-title" variant="h5">
          {t('account.wallets.buy.title')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.wallets.buy.close')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      {/* No Web3 signer needed — the modal only opens hosted on-ramp URLs for the user's address. */}
      {open && <BuyManaContent address={address} onClose={onClose} />}
    </StyledDialog>
  )
}

export { BuyManaModal }

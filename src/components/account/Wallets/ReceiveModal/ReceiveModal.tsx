import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { AddressBox, AddressText, CloseButton, Description, Header, StyledDialog, Title } from './ReceiveModal.styled'

interface ReceiveModalProps {
  open: boolean
  address: string
  onClose: () => void
}

const ReceiveModal = ({ open, address, onClose }: ReceiveModalProps) => {
  const t = useFormatMessage()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Clipboard API unavailable — the address is still visible to copy manually.
      })
  }, [address])

  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="account-receive-title">
      <Header>
        <Title id="account-receive-title" variant="h5">
          {t('account.wallets.receive.title')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.wallets.receive.close')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      <Description>{t('account.wallets.receive.description')}</Description>
      <AddressBox data-role="receive-address">
        <AddressText>{address}</AddressText>
      </AddressBox>
      <Button variant="contained" color="primary" fullWidth onClick={handleCopy}>
        {copied ? t('account.wallets.receive.copied') : t('account.wallets.receive.copy')}
      </Button>
    </StyledDialog>
  )
}

export { ReceiveModal }

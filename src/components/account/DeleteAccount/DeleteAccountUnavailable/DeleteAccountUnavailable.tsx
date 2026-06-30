// eslint-disable-next-line @typescript-eslint/naming-convention
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { Container, Description, TextWrapper, Title } from './DeleteAccountUnavailable.styled'

/**
 * Shown on /account/delete when the connected account is NOT a thirdweb in-app wallet. Account
 * deletion runs entirely through the thirdweb SDK (unlink profiles), so it only applies to email /
 * social-OTP logins — self-custodial wallets manage their own keys and have nothing to delete here.
 */
const DeleteAccountUnavailable = () => {
  const t = useFormatMessage()

  return (
    <Container data-role="delete-account-unavailable">
      <InfoOutlinedIcon sx={{ fontSize: 28, color: '#4A8FE7', flexShrink: 0 }} />
      <TextWrapper>
        <Title>{t('account.delete.unavailable_title')}</Title>
        <Description>{t('account.delete.unavailable_description')}</Description>
      </TextWrapper>
    </Container>
  )
}

export { DeleteAccountUnavailable }

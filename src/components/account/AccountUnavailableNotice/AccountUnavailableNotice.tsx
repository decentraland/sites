// eslint-disable-next-line @typescript-eslint/naming-convention
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { AccountUnavailableNoticeProps } from './AccountUnavailableNotice.types'
import { Container, Description, TextWrapper, Title } from './AccountUnavailableNotice.styled'

/**
 * Shared "this action isn't available for your wallet" panel for account sections (delete, security).
 * Self-custodial / non-eligible logins see this in place of the section's actions.
 */
const AccountUnavailableNotice = ({ title, description, dataRole }: AccountUnavailableNoticeProps) => (
  <Container data-role={dataRole}>
    <InfoOutlinedIcon sx={{ fontSize: 28, color: '#4A8FE7', flexShrink: 0 }} />
    <TextWrapper>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </TextWrapper>
  </Container>
)

export { AccountUnavailableNotice }

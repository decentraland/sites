// eslint-disable-next-line @typescript-eslint/naming-convention
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import {
  Container,
  Intro,
  ResponsibilityDescription,
  ResponsibilityTitle,
  RevealActions,
  RevealDescription,
  SectionTitle,
  TitleRow,
  WarningBox,
  WarningDescription,
  WarningTextWrapper,
  WarningTitle
} from './SecuritySection.styled'

// Magic-hosted, app-slug-scoped reveal page. The same URL is used across environments — the page
// keys off the logged-in Magic session, not a per-env slug. If a future environment ever needs a
// different Magic app whose reveal slug differs, promote this to getEnv('MAGIC_REVEAL_URL').
const REVEAL_URL = 'https://reveal.magic.link/decentraland'

// Shown on /account/security only for Magic logins (the sidebar link + the page guard both gate on
// isMagic). Explains self-custody responsibilities and links out to Magic's secure reveal page.
const SecuritySection = () => {
  const t = useFormatMessage()

  return (
    <Container data-role="security-section">
      <TitleRow>
        <VpnKeyOutlinedIcon sx={{ fontSize: 24, color: '#FCFCFC', flexShrink: 0 }} />
        <SectionTitle>{t('account.security.title')}</SectionTitle>
      </TitleRow>

      <Intro>{t('account.security.intro')}</Intro>

      <ResponsibilityTitle>{t('account.security.responsibility_title')}</ResponsibilityTitle>
      <ResponsibilityDescription>{t('account.security.responsibility_description')}</ResponsibilityDescription>

      <WarningBox>
        <WarningAmberRoundedIcon sx={{ fontSize: 22, color: '#FFA500', flexShrink: 0, marginTop: '1px' }} />
        <WarningTextWrapper>
          <WarningTitle>{t('account.security.warning_title')}</WarningTitle>
          <WarningDescription>{t('account.security.warning_description')}</WarningDescription>
        </WarningTextWrapper>
      </WarningBox>

      <RevealDescription>{t('account.security.reveal_description')}</RevealDescription>
      <RevealActions>
        <Button
          component="a"
          href={REVEAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          data-role="security-reveal-key"
        >
          {t('account.security.reveal_button')}
        </Button>
      </RevealActions>
    </Container>
  )
}

export { SecuritySection }

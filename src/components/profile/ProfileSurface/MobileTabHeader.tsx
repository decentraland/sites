// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { BackButton, CloseButton, HeaderLabel, HeaderRow, Spacer } from './MobileTabHeader.styled'

interface MobileTabHeaderProps {
  label: string
  /** Returns to the mobile navigation root. */
  onBack: () => void
  /** Closes the profile — only modal mounts provide it. */
  onClose?: () => void
}

function MobileTabHeader({ label, onBack, onClose }: MobileTabHeaderProps) {
  const t = useFormatMessage()
  return (
    <HeaderRow>
      <BackButton type="button" onClick={onBack} aria-label={t('profile.header.back')}>
        <ArrowBackIosNewIcon fontSize="small" />
        <HeaderLabel>{label}</HeaderLabel>
      </BackButton>
      <Spacer />
      {onClose ? (
        <CloseButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
          <CloseIcon />
        </CloseButton>
      ) : null}
    </HeaderRow>
  )
}

export { MobileTabHeader }
export type { MobileTabHeaderProps }

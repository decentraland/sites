// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { Actions, CloseButton, Description, ErrorText, Header, StyledDialog, Title } from './OptOutConfirmModal.styled'

interface OptOutConfirmModalProps {
  open: boolean
  isLeaving: boolean
  errorKey: string | null
  onConfirm: () => void
  onClose: () => void
}

const OptOutConfirmModal = (props: OptOutConfirmModalProps) => {
  const { open, isLeaving, errorKey, onConfirm, onClose } = props
  const t = useFormatMessage()

  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="account-credits-leave-title">
      <Header>
        <Title id="account-credits-leave-title" variant="h5">
          {t('account.credits.leave_modal.warning')}
        </Title>
        <CloseButton onClick={onClose} aria-label={t('account.credits.leave_modal.cancel')} size="small">
          <CloseRoundedIcon />
        </CloseButton>
      </Header>
      <Description>{t('account.credits.leave_modal.description')}</Description>
      {errorKey ? <ErrorText data-role="credits-leave-error">{t(errorKey)}</ErrorText> : null}
      <Actions>
        <Button variant="outlined" color="secondary" fullWidth onClick={onClose} disabled={isLeaving} data-role="credits-leave-cancel">
          {t('account.credits.leave_modal.cancel')}
        </Button>
        <Button variant="contained" color="primary" fullWidth onClick={onConfirm} disabled={isLeaving} data-role="credits-leave-confirm">
          {t('account.credits.leave_modal.confirm')}
        </Button>
      </Actions>
    </StyledDialog>
  )
}

export { OptOutConfirmModal }
export type { OptOutConfirmModalProps }

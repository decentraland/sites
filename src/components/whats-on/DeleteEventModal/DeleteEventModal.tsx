import { useCallback } from 'react'
import { useTranslation } from '@dcl/hooks'
import { Button } from 'decentraland-ui2'
import type { DeleteEventModalProps } from './DeleteEventModal.types'
import { CancelActionButton, StyledDialog, StyledDialogActions, Subtitle, Title } from './DeleteEventModal.styled'

function DeleteEventModal({ open, isSubmitting, onClose, onConfirm }: DeleteEventModalProps) {
  const { t } = useTranslation()

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  return (
    <StyledDialog open={open} onClose={handleClose} fullWidth>
      <Title>{t('event_detail.delete_modal.title')}</Title>
      <Subtitle>{t('event_detail.delete_modal.subtitle')}</Subtitle>
      <StyledDialogActions>
        <CancelActionButton variant="contained" onClick={handleClose} disabled={isSubmitting}>
          {t('event_detail.delete_modal.cancel')}
        </CancelActionButton>
        <Button variant="contained" color="primary" onClick={onConfirm} disabled={isSubmitting}>
          {t('event_detail.delete_modal.confirm')}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  )
}

export { DeleteEventModal }

import { useCallback } from 'react'
import { useTranslation } from '@dcl/hooks'
import type { DeleteEventModalProps } from './DeleteEventModal.types'
import { CancelActionButton, DeleteActionButton, StyledDialog, StyledDialogActions, Subtitle, Title } from './DeleteEventModal.styled'

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
        <CancelActionButton type="button" onClick={handleClose} disabled={isSubmitting}>
          {t('event_detail.delete_modal.cancel')}
        </CancelActionButton>
        <DeleteActionButton type="button" onClick={onConfirm} disabled={isSubmitting}>
          {t('event_detail.delete_modal.confirm')}
        </DeleteActionButton>
      </StyledDialogActions>
    </StyledDialog>
  )
}

export { DeleteEventModal }

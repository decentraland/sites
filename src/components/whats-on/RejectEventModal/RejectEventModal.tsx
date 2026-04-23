import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { Button, Checkbox } from 'decentraland-ui2'
import { REJECT_REASONS } from './RejectEventModal.types'
import type { RejectEventModalProps, RejectReasonCode } from './RejectEventModal.types'
import {
  ErrorText,
  NotesField,
  ReasonLabel,
  ReasonRow,
  ReasonsList,
  StyledDialog,
  StyledDialogActions,
  StyledDialogContent,
  Title
} from './RejectEventModal.styled'

function RejectEventModal({ open, isSubmitting, onClose, onSubmit }: RejectEventModalProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<RejectReasonCode>>(new Set())
  const [notes, setNotes] = useState('')
  const [showError, setShowError] = useState(false)

  const toggle = useCallback((reason: RejectReasonCode) => {
    setShowError(false)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(reason)) next.delete(reason)
      else next.add(reason)
      return next
    })
  }, [])

  const reasons = useMemo(() => Array.from(selected), [selected])

  const handleSubmit = useCallback(() => {
    if (reasons.length === 0) {
      setShowError(true)
      return
    }
    onSubmit({ reasons, notes: notes.trim() })
  }, [notes, onSubmit, reasons])

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    setSelected(new Set())
    setNotes('')
    setShowError(false)
    onClose()
  }, [isSubmitting, onClose])

  return (
    <StyledDialog open={open} onClose={handleClose} fullWidth>
      <Title>{t('whats_on_admin.reject_modal.title')}</Title>
      <StyledDialogContent>
        <ReasonsList>
          {REJECT_REASONS.map(reason => {
            const title = t(`whats_on_admin.reject_modal.reasons.${reason}.title`)
            const description = t(`whats_on_admin.reject_modal.reasons.${reason}.description`)
            return (
              <ReasonRow key={reason}>
                <Checkbox
                  checked={selected.has(reason)}
                  onChange={() => toggle(reason)}
                  color="primary"
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  inputProps={{ 'aria-label': title }}
                />
                <ReasonLabel>
                  <strong>{title}</strong> – ({description})
                </ReasonLabel>
              </ReasonRow>
            )
          })}
        </ReasonsList>
        {showError && <ErrorText>{t('whats_on_admin.reject_modal.error_required')}</ErrorText>}
        <NotesField
          label={t('whats_on_admin.reject_modal.other_label')}
          placeholder={t('whats_on_admin.reject_modal.other_placeholder')}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          multiline
          minRows={3}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </StyledDialogContent>
      <StyledDialogActions>
        <Button variant="contained" color="secondary" onClick={handleClose} disabled={isSubmitting}>
          {t('whats_on_admin.reject_modal.cancel')}
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {t('whats_on_admin.reject_modal.submit')}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  )
}

export { RejectEventModal }

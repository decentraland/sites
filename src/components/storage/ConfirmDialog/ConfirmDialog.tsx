import type { FC, ReactNode } from 'react'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from 'decentraland-ui2'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
  pending?: boolean
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = true,
  pending = false
}) => {
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onCancel}
      aria-labelledby="storage-confirm-dialog-title"
      aria-describedby="storage-confirm-dialog-description"
    >
      <DialogTitle id="storage-confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="storage-confirm-dialog-description" component="div">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} aria-label={cancelLabel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color={isDestructive ? 'error' : 'primary'}
          variant="contained"
          aria-label={confirmLabel}
          disabled={pending}
          startIcon={pending ? <CircularProgress size={16} aria-hidden /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { ConfirmDialog }

import type { FC, ReactNode } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from 'decentraland-ui2'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
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
        <Button onClick={onCancel} aria-label={cancelLabel}>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} color={isDestructive ? 'error' : 'primary'} variant="contained" aria-label={confirmLabel}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { ConfirmDialog }

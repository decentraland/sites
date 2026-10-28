import type { FC } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ConfirmDialog } from '../ConfirmDialog'

interface BulkDeleteDialogProps {
  open: boolean
  pending: boolean
  allSelected: boolean
  count: number
  clearTitle: string
  clearMessage: string
  onConfirm: () => void
  onCancel: () => void
}

const BulkDeleteDialog: FC<BulkDeleteDialogProps> = props => {
  const { open, pending, allSelected, count, clearTitle, clearMessage, onConfirm, onCancel } = props
  const t = useFormatMessage()
  return (
    <ConfirmDialog
      open={open}
      pending={pending}
      title={allSelected ? clearTitle : t('component.storage.common.delete_selected_dialog.title')}
      message={allSelected ? clearMessage : t('component.storage.common.delete_selected_dialog.message', { count })}
      confirmLabel={t('component.storage.common.confirm')}
      cancelLabel={t('component.storage.common.cancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export { BulkDeleteDialog }
export type { BulkDeleteDialogProps }

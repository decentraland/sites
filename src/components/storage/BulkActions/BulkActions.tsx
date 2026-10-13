import type { FC } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteIcon from '@mui/icons-material/Delete'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ActionIconButton } from '../_shared/ActionIconButton.styled'
import { ExportMenuButton } from '../ExportMenuButton'

interface BulkActionsProps {
  variant: 'icon' | 'button'
  allSelected: boolean
  count: number
  total: number
  onDelete: () => void
  onDownload?: (format: 'json' | 'csv') => void
  busy?: boolean
}

const BulkActions: FC<BulkActionsProps> = props => {
  const { variant, allSelected, count, total, onDelete, onDownload, busy = false } = props
  const t = useFormatMessage()

  if (!allSelected && count === 0) return null

  const everything = allSelected || count === total
  const downloadLabel = everything ? t('component.storage.common.download_all') : t('component.storage.common.download_selected', { count })
  const deleteLabel = everything ? t('component.storage.common.delete_all') : t('component.storage.common.delete_selected', { count })

  return (
    <>
      {onDownload ? <ExportMenuButton variant={variant} label={downloadLabel} busy={busy} onSelect={onDownload} /> : null}
      {variant === 'icon' ? (
        <ActionIconButton aria-label={deleteLabel} onClick={onDelete}>
          <DeleteIcon />
        </ActionIconButton>
      ) : (
        <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={onDelete}>
          {deleteLabel}
        </Button>
      )}
    </>
  )
}

export { BulkActions }
export type { BulkActionsProps }

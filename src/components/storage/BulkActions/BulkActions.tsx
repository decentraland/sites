import type { FC } from 'react'

interface BulkActionsProps {
  variant: 'icon' | 'button'
  allSelected: boolean
  count: number
  onDelete: () => void
  onDownload?: (format: 'json' | 'csv') => void
  busy?: boolean
}

const BulkActions: FC<BulkActionsProps> = () => null

export { BulkActions }
export type { BulkActionsProps }

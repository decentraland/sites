import type { FC } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteIcon from '@mui/icons-material/Delete'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DownloadIcon from '@mui/icons-material/Download'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditIcon from '@mui/icons-material/Edit'
import { Checkbox, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface KeyTableProps {
  keys: { key: string }[]
  emptyLabel: string
  onEdit: (key: string) => void
  onDelete: (key: string) => void
  onDownload?: (key: string) => void
  selected?: ReadonlySet<string>
  allSelected?: boolean
  onToggle?: (key: string) => void
  onToggleAll?: () => void
}

const KeyTable: FC<KeyTableProps> = props => {
  const { keys, emptyLabel, onEdit, onDelete, onDownload, selected, allSelected = false, onToggle, onToggleAll } = props
  const t = useFormatMessage()

  if (keys.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyLabel}</Typography>
      </Paper>
    )
  }

  const isSelected = (key: string) => allSelected || Boolean(selected?.has(key))
  const headerChecked = keys.every(item => isSelected(item.key))
  const headerIndeterminate = !headerChecked && keys.some(item => isSelected(item.key))

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {onToggle ? (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={headerChecked}
                  indeterminate={headerIndeterminate}
                  onChange={onToggleAll}
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  inputProps={{ 'aria-label': t('component.storage.common.select_all') }}
                />
              </TableCell>
            ) : null}
            <TableCell>{t('component.storage.common.key')}</TableCell>
            <TableCell align="right">{t('component.storage.common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {keys.map(item => (
            <TableRow key={item.key}>
              {onToggle ? (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected(item.key)}
                    onChange={() => onToggle(item.key)}
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    inputProps={{ 'aria-label': t('component.storage.common.select_row', { name: item.key }) }}
                  />
                </TableCell>
              ) : null}
              <TableCell>{item.key}</TableCell>
              <TableCell align="right">
                {onDownload ? (
                  <IconButton aria-label={`download ${item.key}`} color="primary" onClick={() => onDownload(item.key)}>
                    <DownloadIcon />
                  </IconButton>
                ) : null}
                <IconButton aria-label={`edit ${item.key}`} color="primary" onClick={() => onEdit(item.key)}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label={`delete ${item.key}`} color="error" onClick={() => onDelete(item.key)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export { KeyTable }
export type { KeyTableProps }

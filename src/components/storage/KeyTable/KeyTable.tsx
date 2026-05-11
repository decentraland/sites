import type { FC } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteIcon from '@mui/icons-material/Delete'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface KeyTableProps {
  keys: { key: string }[]
  emptyLabel: string
  onEdit: (key: string) => void
  onDelete: (key: string) => void
}

const KeyTable: FC<KeyTableProps> = ({ keys, emptyLabel, onEdit, onDelete }) => {
  const t = useFormatMessage()

  if (keys.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyLabel}</Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('component.storage.common.key')}</TableCell>
            <TableCell align="right">{t('component.storage.common.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {keys.map(item => (
            <TableRow key={item.key}>
              <TableCell>{item.key}</TableCell>
              <TableCell align="right">
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

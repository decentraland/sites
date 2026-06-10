import { useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteIcon from '@mui/icons-material/Delete'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditIcon from '@mui/icons-material/Edit'
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface KeyTableProps {
  keys: { key: string }[]
  emptyLabel: string
  onEdit: (key: string) => void
  onDelete: (key: string) => void
}

const DEFAULT_ROWS_PER_PAGE = 10
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50]

const KeyTable: FC<KeyTableProps> = ({ keys, emptyLabel, onEdit, onDelete }) => {
  const t = useFormatMessage()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE)

  // Keep the page in range when keys are removed (e.g. deleting the last row on
  // the final page) so we never land on an empty page.
  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(keys.length / rowsPerPage) - 1)
    if (page > lastPage) setPage(lastPage)
  }, [keys.length, rowsPerPage, page])

  const paginated = useMemo(() => keys.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [keys, page, rowsPerPage])

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
          {paginated.map(item => (
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
      {/* Only surface the pager once the list outgrows a single page. */}
      {keys.length > DEFAULT_ROWS_PER_PAGE ? (
        <TablePagination
          component="div"
          count={keys.length}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={event => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        />
      ) : null}
    </TableContainer>
  )
}

export { KeyTable }
export type { KeyTableProps }

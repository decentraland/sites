import { memo, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/naming-convention
import SearchIcon from '@mui/icons-material/Search'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useTranslation } from '@dcl/hooks'
import {
  Alert,
  Button,
  InputAdornment,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField
} from 'decentraland-ui2'
import { AdminPermissionsModal } from '../../components/whats-on/AdminPermissionsModal'
import { useListAdminsQuery, useUpdateAdminPermissionsMutation } from '../../features/whats-on/admin/admin.client'
import { AdminPermission } from '../../features/whats-on/admin/admin.types'
import type { AdminProfileSettings } from '../../features/whats-on/admin/admin.types'
import { useAdminPermissions } from '../../hooks/useAdminPermissions'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useProfileAvatar } from '../../hooks/useProfileAvatar'
import { AdminPageContainer, AdminPageTitle } from './AdminLayout.styled'
import { ClickableRow, Header, TableWrapper, UserAvatar } from './UsersAdminPage.styled'

const COLUMNS: Array<{ key: AdminPermission; labelKey: string }> = [
  { key: AdminPermission.APPROVE_OWN_EVENT, labelKey: 'whats_on_admin.users.columns.approve_own_events' },
  { key: AdminPermission.APPROVE_ANY_EVENT, labelKey: 'whats_on_admin.users.columns.approve_events' },
  { key: AdminPermission.EDIT_ANY_EVENT, labelKey: 'whats_on_admin.users.columns.edit_events' },
  { key: AdminPermission.EDIT_ANY_PROFILE, labelKey: 'whats_on_admin.users.columns.edit_users' }
]

type ModalState = { mode: 'add'; permissions: AdminPermission[] } | { mode: 'edit'; user: string; permissions: AdminPermission[] }

const UserTableRow = memo(function UserTableRow({ row, onClick }: { row: AdminProfileSettings; onClick: () => void }) {
  const { avatarFace, name } = useProfileAvatar(row.user)
  return (
    <ClickableRow hover onClick={onClick}>
      <TableCell>
        <UserAvatar src={avatarFace} />
        {row.user}
        {name ? ` (${name})` : null}
      </TableCell>
      {COLUMNS.map(column => (
        <TableCell key={column.key} align="center">
          {row.permissions.includes(column.key) ? <CheckIcon color="success" /> : null}
        </TableCell>
      ))}
    </ClickableRow>
  )
})

function UsersAdminPage() {
  const { t } = useTranslation()
  const { canEditAnyProfile, isLoading } = useAdminPermissions()
  const { identity } = useAuthIdentity()
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data = [], isFetching } = useListAdminsQuery(identity && canEditAnyProfile ? { identity } : skipToken)
  const [updatePermissions, { isLoading: isSubmitting }] = useUpdateAdminPermissionsMutation()

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return query ? data.filter(row => row.user.toLowerCase().includes(query)) : data
  }, [data, search])

  const paginated = useMemo(() => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filtered, page, rowsPerPage])

  if (!isLoading && !canEditAnyProfile) return <Navigate to="/whats-on" replace />

  const handleSubmit = async ({ address, permissions }: { address: string; permissions: AdminPermission[] }) => {
    if (!identity) {
      console.error('[UsersAdminPage] missing identity on submit')
      return
    }
    try {
      await updatePermissions({ address, permissions, identity }).unwrap()
      setModalState(null)
      setFeedback({ message: t('whats_on_admin.permissions_modal.save_success'), severity: 'success' })
    } catch (error) {
      console.error('[UsersAdminPage] updatePermissions failed', error)
      setFeedback({ message: t('whats_on_admin.permissions_modal.save_error'), severity: 'error' })
    }
  }

  return (
    <AdminPageContainer>
      <AdminPageTitle component="h1">{t('whats_on_admin.users.title')}</AdminPageTitle>
      <Header>
        <TextField
          label={t('whats_on_admin.users.search_label')}
          placeholder={t('whats_on_admin.users.search_placeholder')}
          value={search}
          onChange={event => setSearch(event.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
        <Button variant="contained" color="primary" onClick={() => setModalState({ mode: 'add', permissions: [] })}>
          {t('whats_on_admin.cta.add_user')}
        </Button>
      </Header>

      <TableWrapper>
        <Table aria-label={t('whats_on_admin.users.title')}>
          <TableHead>
            <TableRow>
              <TableCell>{t('whats_on_admin.users.columns.user')}</TableCell>
              {COLUMNS.map(column => (
                <TableCell key={column.key} align="center">
                  {t(column.labelKey)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map(row => (
              <UserTableRow
                key={row.user}
                row={row}
                onClick={() => setModalState({ mode: 'edit', user: row.user, permissions: row.permissions })}
              />
            ))}
            {!isFetching && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center">
                  {t('whats_on_admin.users.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={event => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableWrapper>

      {modalState && (
        <AdminPermissionsModal
          key={modalState.mode === 'edit' ? modalState.user : 'add'}
          open
          {...(modalState.mode === 'edit' ? { mode: 'edit' as const, initialUser: modalState.user } : { mode: 'add' as const })}
          initialPermissions={modalState.permissions}
          isSubmitting={isSubmitting}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}

      <Snackbar
        open={feedback !== null}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} variant="filled">
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </AdminPageContainer>
  )
}

export { UsersAdminPage }

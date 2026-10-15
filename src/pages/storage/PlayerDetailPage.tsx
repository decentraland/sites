import { useCallback, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, ButtonBase, CircularProgress, Typography } from 'decentraland-ui2'
import { BulkActions } from '../../components/storage/BulkActions'
import { BulkDeleteDialog } from '../../components/storage/BulkDeleteDialog'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { KeyTable } from '../../components/storage/KeyTable'
import { PlayerAddDialog, PlayerEditDialog } from '../../components/storage/PlayerDialogs'
import { StorageLayout } from '../../components/storage/StorageLayout'
import {
  buildExportFile,
  getStorageErrorStatus,
  toStorageValueFile,
  truncateAddress,
  useClearPlayerMutation,
  useDeletePlayerValueMutation,
  useLazyGetPlayerValueQuery,
  useListPlayerKeysQuery
} from '../../features/storage'
import type { ExportFormat } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBulkDelete } from '../../hooks/useBulkDelete'
import { useLeaveGuard } from '../../hooks/useLeaveGuard'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import { useSelection } from '../../hooks/useSelection'
import { useStorageExport } from '../../hooks/useStorageExport'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'
import { useStorageTrack } from '../../hooks/useStorageTrack'
import { triggerBlobDownload } from '../../modules/file'
import { SegmentEvent } from '../../modules/segment.types'
import { ExportAlert, SectionActions, SectionHeader } from './shared.styled'

function PlayerDetailPageContent() {
  useStorageRedirect()
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address = '' } = useParams<{ address: string }>()
  const { identity } = useAuthIdentity()
  const { realm, position, blocked } = useStorageScope()
  const track = useStorageTrack()

  const { currentData: keys, isLoading } = useListPlayerKeysQuery(
    { identity, address, realm, position },
    { skip: !identity || !address || blocked }
  )
  const [deletePlayerValue] = useDeletePlayerValueMutation()
  const [clearPlayer] = useClearPlayerMutation()
  const [getPlayerValue] = useLazyGetPlayerValueQuery()
  const keyIds = useMemo(() => keys?.map(({ key }) => key) ?? [], [keys])
  const selection = useSelection(keyIds, `${address}:${realm ?? ''}:${position ?? ''}`)
  const { startExport, busy } = useStorageExport()
  const confirmLeave = useLeaveGuard(busy)

  const bulkDelete = useBulkDelete({
    selection,
    deleteOne: key => deletePlayerValue({ identity, realm, position, address, key }).unwrap(),
    clearAll: () => clearPlayer({ identity, realm, position, address }).unwrap(),
    onResult: ({ allSelected, ok, count }) => {
      if (allSelected) {
        track(ok ? SegmentEvent.STORAGE_PLAYER_CLEAR_SUCCESS : SegmentEvent.STORAGE_PLAYER_CLEAR_FAILURE)
      } else {
        track(ok ? SegmentEvent.STORAGE_PLAYER_DELETE_SUCCESS : SegmentEvent.STORAGE_PLAYER_DELETE_FAILURE, { count })
      }
    }
  })

  const [addOpen, setAddOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteKey) return
    try {
      await deletePlayerValue({ identity, realm, position, address, key: deleteKey }).unwrap()
      track(SegmentEvent.STORAGE_PLAYER_DELETE_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_PLAYER_DELETE_FAILURE)
    }
    setDeleteKey(null)
  }, [deletePlayerValue, deleteKey, identity, realm, position, address, track])

  const handleDownload = useCallback(
    async (key: string) => {
      try {
        const { value } = await getPlayerValue({ identity, realm, position, address, key }).unwrap()
        const { filename, type, content } = toStorageValueFile(key, value)
        triggerBlobDownload(new Blob([content], { type }), filename)
        track(SegmentEvent.STORAGE_PLAYER_DOWNLOAD_SUCCESS)
      } catch (error) {
        track(SegmentEvent.STORAGE_PLAYER_DOWNLOAD_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })
      }
    },
    [getPlayerValue, identity, realm, position, address, track]
  )

  const handleExportSelected = useCallback(
    (format: ExportFormat) => {
      if (selection.allSelected) {
        startExport({ world: { keys: [] }, players: { addresses: [address] } }, format)
        return
      }
      const rows = (keys ?? []).filter(({ key }) => selection.selected.has(key)).map(({ key, value }) => ({ address, key, value }))
      const { filename, type, content } = buildExportFile(format, [], rows)
      triggerBlobDownload(new Blob([content], { type }), filename)
      track(SegmentEvent.STORAGE_SELECTION_DOWNLOAD_SUCCESS, { format, count: rows.length })
    },
    [selection.allSelected, selection.selected, keys, address, startExport, track]
  )

  const handleBackToList = useCallback(() => {
    navigate({ pathname: '/storage/players', search: window.location.search })
  }, [navigate])

  const handleBackClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      confirmLeave(handleBackToList)
    },
    [confirmLeave, handleBackToList]
  )

  usePageViewTracking({
    name: t('page.storage.player_detail.title', { address: truncateAddress(address) }),
    properties: {
      section: 'storage_player_detail',
      realm: realm ?? undefined,
      position: position ?? undefined,
      address
    }
  })

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.player_detail.title', { address: truncateAddress(address) })}</title>
      </Helmet>
      <Box sx={{ mb: 2 }}>
        <ButtonBase
          component={Link}
          to={{ pathname: '/storage/players', search: window.location.search }}
          onClick={handleBackClick}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          aria-label={t('component.storage.player_page.back_to_players')}
        >
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2">{t('component.storage.player_page.back_to_players')}</Typography>
        </ButtonBase>
      </Box>
      <SectionHeader>
        <h2>{t('component.storage.player_page.keys_for', { address: truncateAddress(address) })}</h2>
        <SectionActions>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            {t('component.storage.player_page.add')}
          </Button>
        </SectionActions>
      </SectionHeader>
      {bulkDelete.errorKey ? (
        <ExportAlert severity="error" onClose={bulkDelete.clearError}>
          {t(bulkDelete.errorKey)}
        </ExportAlert>
      ) : null}

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress aria-label={t('component.storage.player_page.loading_keys')} />
        </Box>
      ) : (
        <KeyTable
          keys={keys ?? []}
          emptyLabel={t('component.storage.player_page.no_keys')}
          onEdit={setEditKey}
          onDelete={setDeleteKey}
          onDownload={handleDownload}
          selected={selection.selected}
          allSelected={selection.allSelected}
          onToggle={selection.toggle}
          onToggleAll={selection.toggleAll}
          bulkActions={
            <BulkActions
              variant="icon"
              allSelected={selection.allSelected}
              count={selection.count}
              busy={busy}
              onDownload={handleExportSelected}
              onDelete={bulkDelete.request}
            />
          }
        />
      )}

      <PlayerAddDialog
        open={addOpen}
        address={address}
        onClose={() => setAddOpen(false)}
        onSuccess={() => track(SegmentEvent.STORAGE_PLAYER_SET_SUCCESS)}
        onError={error => track(SegmentEvent.STORAGE_PLAYER_SET_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })}
        identity={identity}
        realm={realm}
        position={position}
      />
      {editKey ? (
        <PlayerEditDialog
          open
          address={address}
          keyName={editKey}
          onClose={() => setEditKey(null)}
          onSuccess={() => track(SegmentEvent.STORAGE_PLAYER_SET_SUCCESS)}
          onError={error => track(SegmentEvent.STORAGE_PLAYER_SET_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })}
          identity={identity}
          realm={realm}
          position={position}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteKey)}
        title={t('component.storage.player_page.delete_dialog.title')}
        message={t('component.storage.player_page.delete_dialog.message', { key: deleteKey ?? '', address: truncateAddress(address) })}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteKey(null)}
      />
      <BulkDeleteDialog
        open={bulkDelete.open}
        pending={bulkDelete.pending}
        allSelected={selection.allSelected}
        count={selection.count}
        clearTitle={t('component.storage.player_page.clear_player_dialog.title')}
        clearMessage={t('component.storage.player_page.clear_player_dialog.message', { address: truncateAddress(address) })}
        onConfirm={bulkDelete.confirm}
        onCancel={bulkDelete.cancel}
      />
    </StorageLayout>
  )
}

function PlayerDetailPage() {
  const { address } = useAuthIdentity()
  return <PlayerDetailPageContent key={address?.toLowerCase() ?? 'anon'} />
}

export { PlayerDetailPage }

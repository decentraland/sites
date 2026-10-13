import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
import { Box, Button, CircularProgress } from 'decentraland-ui2'
import { BulkActions } from '../../components/storage/BulkActions'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { EnvAddDialog, EnvEditDialog } from '../../components/storage/EnvDialogs'
import { KeyTable } from '../../components/storage/KeyTable'
import { StorageLayout } from '../../components/storage/StorageLayout'
import {
  deleteSelection,
  getStorageErrorStatus,
  useClearEnvMutation,
  useDeleteEnvMutation,
  useListEnvKeysQuery
} from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import { useSelection } from '../../hooks/useSelection'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'
import { useStorageTrack } from '../../hooks/useStorageTrack'
import { SegmentEvent } from '../../modules/segment.types'
import { SectionActions, SectionHeader } from './shared.styled'

function EnvPageContent() {
  useStorageRedirect()
  const t = useFormatMessage()
  const { identity } = useAuthIdentity()
  const { realm, position, blocked } = useStorageScope()
  const track = useStorageTrack()

  const { currentData: envKeys, isLoading } = useListEnvKeysQuery({ identity, realm, position }, { skip: !identity || blocked })
  const [deleteEnv] = useDeleteEnvMutation()
  const [clearEnv] = useClearEnvMutation()
  const envKeyIds = useMemo(() => envKeys?.map(({ key }) => key) ?? [], [envKeys])
  const selection = useSelection(envKeyIds)

  const [addOpen, setAddOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteKey) return
    try {
      await deleteEnv({ identity, realm, position, key: deleteKey }).unwrap()
      track(SegmentEvent.STORAGE_ENV_DELETE_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_ENV_DELETE_FAILURE)
    }
    setDeleteKey(null)
  }, [deleteEnv, deleteKey, identity, realm, position, track])

  const handleConfirmBulkDelete = useCallback(async () => {
    const { allSelected, selected, clear } = selection
    const ok = await deleteSelection({
      allSelected,
      ids: [...selected],
      deleteOne: key => deleteEnv({ identity, realm, position, key }).unwrap(),
      clearAll: () => clearEnv({ identity, realm, position }).unwrap()
    })
    if (allSelected) {
      track(ok ? SegmentEvent.STORAGE_ENV_CLEAR_SUCCESS : SegmentEvent.STORAGE_ENV_CLEAR_FAILURE)
    } else {
      track(ok ? SegmentEvent.STORAGE_ENV_DELETE_SUCCESS : SegmentEvent.STORAGE_ENV_DELETE_FAILURE, { count: selected.size })
    }
    clear()
    setBulkDeleteOpen(false)
  }, [selection, deleteEnv, clearEnv, identity, realm, position, track])

  usePageViewTracking({
    name: t('page.storage.env.title'),
    properties: { section: 'storage_env', realm: realm ?? undefined, position: position ?? undefined }
  })

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.env.title')}</title>
      </Helmet>
      <SectionHeader>
        <h2>{t('component.storage.env_page.title')}</h2>
        <SectionActions>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            {t('component.storage.env_page.add')}
          </Button>
        </SectionActions>
      </SectionHeader>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <KeyTable
          keys={envKeys ?? []}
          emptyLabel={t('component.storage.env_page.no_keys')}
          onEdit={setEditKey}
          onDelete={setDeleteKey}
          selected={selection.selected}
          allSelected={selection.allSelected}
          onToggle={selection.toggle}
          onToggleAll={selection.toggleAll}
          bulkActions={
            <BulkActions
              variant="icon"
              allSelected={selection.allSelected}
              count={selection.count}
              onDelete={() => setBulkDeleteOpen(true)}
            />
          }
        />
      )}

      <EnvAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => track(SegmentEvent.STORAGE_ENV_SET_SUCCESS)}
        onError={error => track(SegmentEvent.STORAGE_ENV_SET_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })}
        identity={identity}
        realm={realm}
        position={position}
      />
      {editKey ? (
        <EnvEditDialog
          open
          keyName={editKey}
          onClose={() => setEditKey(null)}
          onSuccess={() => track(SegmentEvent.STORAGE_ENV_SET_SUCCESS)}
          onError={error => track(SegmentEvent.STORAGE_ENV_SET_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })}
          identity={identity}
          realm={realm}
          position={position}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteKey)}
        title={t('component.storage.env_page.delete_dialog.title')}
        message={t('component.storage.env_page.delete_dialog.message', { key: deleteKey ?? '' })}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteKey(null)}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={
          selection.allSelected
            ? t('component.storage.env_page.clear_dialog.title')
            : t('component.storage.common.delete_selected_dialog.title')
        }
        message={
          selection.allSelected
            ? t('component.storage.env_page.clear_dialog.message')
            : t('component.storage.common.delete_selected_dialog.message', { count: selection.count })
        }
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </StorageLayout>
  )
}

function EnvPage() {
  const { address } = useAuthIdentity()
  return <EnvPageContent key={address?.toLowerCase() ?? 'anon'} />
}

export { EnvPage }

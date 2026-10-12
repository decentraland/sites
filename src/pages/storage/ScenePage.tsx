import { useCallback, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Box, Button, CircularProgress } from 'decentraland-ui2'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { ExportMenuButton } from '../../components/storage/ExportMenuButton'
import { KeyTable } from '../../components/storage/KeyTable'
import { SceneAddDialog, SceneEditDialog } from '../../components/storage/SceneDialogs'
import { StorageLayout } from '../../components/storage/StorageLayout'
import {
  buildExportFile,
  getStorageErrorStatus,
  toStorageValueFile,
  useClearSceneMutation,
  useDeleteSceneValueMutation,
  useLazyGetSceneValueQuery,
  useListSceneKeysQuery
} from '../../features/storage'
import type { ExportFormat } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
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

function ScenePageContent() {
  useStorageRedirect()
  const t = useFormatMessage()
  const { identity } = useAuthIdentity()
  const { realm, position, blocked } = useStorageScope()
  const track = useStorageTrack()

  const { currentData: sceneKeys, isLoading } = useListSceneKeysQuery({ identity, realm, position }, { skip: !identity || blocked })
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()
  const [getSceneValue] = useLazyGetSceneValueQuery()
  const sceneKeyIds = useMemo(() => sceneKeys?.map(({ key }) => key) ?? [], [sceneKeys])
  const selection = useSelection(sceneKeyIds)
  const { startExport, busy, errorKey, clearError } = useStorageExport()
  useLeaveGuard(busy)

  const [addOpen, setAddOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteKey) return
    try {
      await deleteSceneValue({ identity, realm, position, key: deleteKey }).unwrap()
      track(SegmentEvent.STORAGE_SCENE_DELETE_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_SCENE_DELETE_FAILURE)
    }
    setDeleteKey(null)
  }, [deleteSceneValue, deleteKey, identity, realm, position, track])

  const handleDownload = useCallback(
    async (key: string) => {
      try {
        const { value } = await getSceneValue({ identity, realm, position, key }).unwrap()
        const { filename, type, content } = toStorageValueFile(key, value)
        triggerBlobDownload(new Blob([content], { type }), filename)
        track(SegmentEvent.STORAGE_SCENE_DOWNLOAD_SUCCESS)
      } catch (error) {
        track(SegmentEvent.STORAGE_SCENE_DOWNLOAD_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })
      }
    },
    [getSceneValue, identity, realm, position, track]
  )

  const handleConfirmClear = useCallback(async () => {
    try {
      await clearScene({ identity, realm, position }).unwrap()
      track(SegmentEvent.STORAGE_SCENE_CLEAR_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_SCENE_CLEAR_FAILURE)
    }
    setClearOpen(false)
  }, [clearScene, identity, realm, position, track])

  const handleExportSelected = useCallback(
    (format: ExportFormat) => {
      if (selection.allSelected) {
        startExport({ players: { addresses: [] } }, format)
        return
      }
      const rows = (sceneKeys ?? []).filter(({ key }) => selection.selected.has(key))
      const { filename, type, content } = buildExportFile(format, rows, [])
      triggerBlobDownload(new Blob([content], { type }), filename)
      track(SegmentEvent.STORAGE_SELECTION_DOWNLOAD_SUCCESS, { format, count: rows.length })
    },
    [selection.allSelected, selection.selected, sceneKeys, startExport, track]
  )

  usePageViewTracking({
    name: t('page.storage.scene.title'),
    properties: { section: 'storage_scene', realm: realm ?? undefined, position: position ?? undefined }
  })

  const hasKeys = (sceneKeys?.length ?? 0) > 0

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.scene.title')}</title>
      </Helmet>
      <SectionHeader>
        <h2>{t('component.storage.scene_page.title')}</h2>
        <SectionActions>
          {selection.allSelected || selection.count > 0 ? (
            <ExportMenuButton
              label={
                selection.allSelected
                  ? t('component.storage.common.download_all_selected')
                  : t('component.storage.common.download_selected', { count: selection.count })
              }
              busy={busy}
              onSelect={handleExportSelected}
            />
          ) : null}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            {t('component.storage.scene_page.add')}
          </Button>
          {hasKeys ? (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
              {t('component.storage.scene_page.clear_all')}
            </Button>
          ) : null}
        </SectionActions>
      </SectionHeader>
      {errorKey ? (
        <ExportAlert severity="error" onClose={clearError}>
          {t(errorKey)}
        </ExportAlert>
      ) : null}

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <KeyTable
          keys={sceneKeys ?? []}
          emptyLabel={t('component.storage.scene_page.no_keys')}
          onEdit={setEditKey}
          onDelete={setDeleteKey}
          onDownload={handleDownload}
          selected={selection.selected}
          allSelected={selection.allSelected}
          onToggle={selection.toggle}
          onToggleAll={selection.toggleAll}
        />
      )}

      <SceneAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => track(SegmentEvent.STORAGE_SCENE_SET_SUCCESS)}
        onError={error => track(SegmentEvent.STORAGE_SCENE_SET_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })}
        identity={identity}
        realm={realm}
        position={position}
      />
      {editKey ? (
        <SceneEditDialog
          open
          keyName={editKey}
          onClose={() => setEditKey(null)}
          onSuccess={() => track(SegmentEvent.STORAGE_SCENE_SET_SUCCESS)}
          onError={error => track(SegmentEvent.STORAGE_SCENE_SET_FAILURE, { errorStatus: getStorageErrorStatus(error) ?? 'unknown' })}
          identity={identity}
          realm={realm}
          position={position}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteKey)}
        title={t('component.storage.scene_page.delete_dialog.title')}
        message={t('component.storage.scene_page.delete_dialog.message', { key: deleteKey ?? '' })}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteKey(null)}
      />
      <ConfirmDialog
        open={clearOpen}
        title={t('component.storage.scene_page.clear_dialog.title')}
        message={t('component.storage.scene_page.clear_dialog.message')}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmClear}
        onCancel={() => setClearOpen(false)}
      />
    </StorageLayout>
  )
}

function ScenePage() {
  const { address } = useAuthIdentity()
  return <ScenePageContent key={address?.toLowerCase() ?? 'anon'} />
}

export { ScenePage }

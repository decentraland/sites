import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Box, Button, CircularProgress } from 'decentraland-ui2'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { KeyTable } from '../../components/storage/KeyTable'
import { SceneAddDialog, SceneEditDialog } from '../../components/storage/SceneDialogs'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useClearSceneMutation, useDeleteSceneValueMutation, useListSceneKeysQuery } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'
import { useStorageTrack } from '../../hooks/useStorageTrack'
import { SegmentEvent } from '../../modules/segment.types'
import { SectionHeader } from './shared.styled'

function ScenePage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()
  const track = useStorageTrack()

  const { data: sceneKeys, isLoading } = useListSceneKeysQuery({ identity, realm, position }, { skip: !identity })
  const [deleteSceneValue] = useDeleteSceneValueMutation()
  const [clearScene] = useClearSceneMutation()

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

  const handleConfirmClear = useCallback(async () => {
    try {
      await clearScene({ identity, realm, position }).unwrap()
      track(SegmentEvent.STORAGE_SCENE_CLEAR_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_SCENE_CLEAR_FAILURE)
    }
    setClearOpen(false)
  }, [clearScene, identity, realm, position, track])

  useBlogPageTracking({
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
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ mr: 1 }}>
            {t('component.storage.scene_page.add')}
          </Button>
          {hasKeys ? (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
              {t('component.storage.scene_page.clear_all')}
            </Button>
          ) : null}
        </Box>
      </SectionHeader>

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
        />
      )}

      <SceneAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => track(SegmentEvent.STORAGE_SCENE_SET_SUCCESS)}
        onError={() => track(SegmentEvent.STORAGE_SCENE_SET_FAILURE)}
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
          onError={() => track(SegmentEvent.STORAGE_SCENE_SET_FAILURE)}
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

export { ScenePage }

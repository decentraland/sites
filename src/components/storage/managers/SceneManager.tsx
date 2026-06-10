import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import type { AuthIdentity } from '@dcl/crypto'
import { Box, Button, CircularProgress } from 'decentraland-ui2'
import { getStorageErrorStatus, useClearSceneMutation, useDeleteSceneValueMutation, useListSceneKeysQuery } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useStorageTrack } from '../../../hooks/useStorageTrack'
import { SegmentEvent } from '../../../modules/segment.types'
import { ConfirmDialog } from '../ConfirmDialog'
import { KeyTable } from '../KeyTable'
import { SceneAddDialog, SceneEditDialog } from '../SceneDialogs'
import { SectionHeader } from './managers.styled'

interface SceneManagerProps {
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
}

// Scene key-value storage manager. Extracted from ScenePage so `/storage/*` and
// the creators world dashboard share one implementation (rule 4). The parent
// provides the storage scope (identity + realm + position).
function SceneManager(props: SceneManagerProps) {
  const { identity, realm, position } = props
  const t = useFormatMessage()
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

  const hasKeys = (sceneKeys?.length ?? 0) > 0

  return (
    <Box>
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
    </Box>
  )
}

export { SceneManager }
export type { SceneManagerProps }

import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import type { AuthIdentity } from '@dcl/crypto'
import { Box, Button, CircularProgress } from 'decentraland-ui2'
import { getStorageErrorStatus, useClearEnvMutation, useDeleteEnvMutation, useListEnvKeysQuery } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useStorageTrack } from '../../../hooks/useStorageTrack'
import { SegmentEvent } from '../../../modules/segment.types'
import { ConfirmDialog } from '../ConfirmDialog'
import { EnvAddDialog, EnvEditDialog } from '../EnvDialogs'
import { KeyTable } from '../KeyTable'
import { SectionHeader } from './managers.styled'

interface EnvManagerProps {
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
}

// World/scene environment-variable manager. Extracted from EnvPage so the
// `/storage/*` routes and the creators world dashboard share one implementation
// (rule 4 — single source). Owns its add/edit/delete/clear dialogs; the parent
// provides the storage scope (identity + realm + position).
function EnvManager(props: EnvManagerProps) {
  const { identity, realm, position } = props
  const t = useFormatMessage()
  const track = useStorageTrack()

  const { data: envKeys, isLoading } = useListEnvKeysQuery({ identity, realm, position }, { skip: !identity })
  const [deleteEnv] = useDeleteEnvMutation()
  const [clearEnv] = useClearEnvMutation()

  const [addOpen, setAddOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

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

  const handleConfirmClear = useCallback(async () => {
    try {
      await clearEnv({ identity, realm, position }).unwrap()
      track(SegmentEvent.STORAGE_ENV_CLEAR_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_ENV_CLEAR_FAILURE)
    }
    setClearOpen(false)
  }, [clearEnv, identity, realm, position, track])

  const hasKeys = (envKeys?.length ?? 0) > 0

  return (
    <Box>
      <SectionHeader>
        <h2>{t('component.storage.env_page.title')}</h2>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ mr: 1 }}>
            {t('component.storage.env_page.add')}
          </Button>
          {hasKeys ? (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
              {t('component.storage.env_page.clear_all')}
            </Button>
          ) : null}
        </Box>
      </SectionHeader>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <KeyTable keys={envKeys ?? []} emptyLabel={t('component.storage.env_page.no_keys')} onEdit={setEditKey} onDelete={setDeleteKey} />
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
        open={clearOpen}
        title={t('component.storage.env_page.clear_dialog.title')}
        message={t('component.storage.env_page.clear_dialog.message')}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmClear}
        onCancel={() => setClearOpen(false)}
      />
    </Box>
  )
}

export { EnvManager }
export type { EnvManagerProps }

import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AddIcon from '@mui/icons-material/Add'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Box, Button, ButtonBase, CircularProgress, Typography } from 'decentraland-ui2'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { KeyTable } from '../../components/storage/KeyTable'
import { PlayerAddDialog, PlayerEditDialog } from '../../components/storage/PlayerDialogs'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { truncateAddress, useClearPlayerMutation, useDeletePlayerValueMutation, useListPlayerKeysQuery } from '../../features/world/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'
import { useStorageTrack } from '../../hooks/useStorageTrack'
import { SegmentEvent } from '../../modules/segment.types'
import { SectionHeader } from './shared.styled'

function PlayerDetailPage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { address = '' } = useParams<{ address: string }>()
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()
  const track = useStorageTrack()

  const { data: keys, isLoading } = useListPlayerKeysQuery({ identity, address, realm, position }, { skip: !identity || !address })
  const [deletePlayerValue] = useDeletePlayerValueMutation()
  const [clearPlayer] = useClearPlayerMutation()

  const [addOpen, setAddOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

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

  const handleConfirmClear = useCallback(async () => {
    try {
      await clearPlayer({ identity, realm, position, address }).unwrap()
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_FAILURE)
    }
    setClearOpen(false)
  }, [clearPlayer, identity, realm, position, address, track])

  const handleBackToList = useCallback(() => {
    navigate({ pathname: '/storage/players', search: window.location.search })
  }, [navigate])

  useBlogPageTracking({
    name: t('page.storage.player_detail.title', { address: truncateAddress(address) }),
    properties: {
      section: 'storage_player_detail',
      realm: realm ?? undefined,
      position: position ?? undefined,
      address
    }
  })

  const hasKeys = (keys?.length ?? 0) > 0

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.player_detail.title', { address: truncateAddress(address) })}</title>
      </Helmet>
      <Box sx={{ mb: 2 }}>
        <ButtonBase
          component={Link}
          to={{ pathname: '/storage/players', search: window.location.search }}
          onClick={handleBackToList}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          aria-label={t('component.storage.player_page.back_to_players')}
        >
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2">{t('component.storage.player_page.back_to_players')}</Typography>
        </ButtonBase>
      </Box>
      <SectionHeader>
        <h2>{t('component.storage.player_page.keys_for', { address: truncateAddress(address) })}</h2>
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ mr: 1 }}>
            {t('component.storage.player_page.add')}
          </Button>
          {hasKeys ? (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
              {t('component.storage.player_page.clear_this_player')}
            </Button>
          ) : null}
        </Box>
      </SectionHeader>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress aria-label={t('component.storage.player_page.loading_keys')} />
        </Box>
      ) : (
        <KeyTable keys={keys ?? []} emptyLabel={t('component.storage.player_page.no_keys')} onEdit={setEditKey} onDelete={setDeleteKey} />
      )}

      <PlayerAddDialog
        open={addOpen}
        address={address}
        onClose={() => setAddOpen(false)}
        onSuccess={() => track(SegmentEvent.STORAGE_PLAYER_SET_SUCCESS)}
        onError={() => track(SegmentEvent.STORAGE_PLAYER_SET_FAILURE)}
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
          onError={() => track(SegmentEvent.STORAGE_PLAYER_SET_FAILURE)}
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
      <ConfirmDialog
        open={clearOpen}
        title={t('component.storage.player_page.clear_player_dialog.title')}
        message={t('component.storage.player_page.clear_player_dialog.message', { address: truncateAddress(address) })}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmClear}
        onCancel={() => setClearOpen(false)}
      />
    </StorageLayout>
  )
}

export { PlayerDetailPage }

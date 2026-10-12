import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, Typography } from 'decentraland-ui2'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { ExportMenuButton } from '../../components/storage/ExportMenuButton'
import { PlayerCard } from '../../components/storage/PlayerCard'
import { SearchField } from '../../components/storage/SearchField'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useGetProfileNames } from '../../features/profile/profile.client'
import { useClearAllPlayersMutation, useListPlayersQuery } from '../../features/storage'
import type { ExportFormat } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import { useSelection } from '../../hooks/useSelection'
import { useStorageExport } from '../../hooks/useStorageExport'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'
import { useStorageTrack } from '../../hooks/useStorageTrack'
import { SegmentEvent } from '../../modules/segment.types'
import { CardsGrid } from './SelectPage.styled'
import { ExportAlert, SectionActions, SectionHeader } from './shared.styled'

function PlayersPageContent() {
  useStorageRedirect()
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { identity } = useAuthIdentity()
  const { realm, position, blocked } = useStorageScope()
  const track = useStorageTrack()

  const { currentData: players, isLoading } = useListPlayersQuery({ identity, realm, position }, { skip: !identity || blocked })
  const [clearAllPlayers] = useClearAllPlayersMutation()

  const [query, setQuery] = useState('')
  const [clearOpen, setClearOpen] = useState(false)

  const playerAddresses = useMemo(() => players ?? [], [players])
  const profileNames = useGetProfileNames(playerAddresses)
  const selection = useSelection(playerAddresses)
  const { startExport, busy, errorKey, clearError } = useStorageExport()

  const filteredPlayers = useMemo(() => {
    if (!query.trim()) return playerAddresses
    const needle = query.trim().toLowerCase()
    return playerAddresses.filter(address => {
      if (address.toLowerCase().includes(needle)) return true
      const name = profileNames.get(address.toLowerCase())
      return name ? name.toLowerCase().includes(needle) : false
    })
  }, [playerAddresses, query, profileNames])

  const handleSelectPlayer = useCallback(
    (address: string) => {
      navigate({ pathname: `/storage/players/${address}`, search: window.location.search })
    },
    [navigate]
  )

  const handleExportSelected = useCallback(
    (format: ExportFormat) => {
      startExport(
        selection.allSelected ? { world: { keys: [] } } : { world: { keys: [] }, players: { addresses: [...selection.selected] } },
        format
      )
    },
    [selection.allSelected, selection.selected, startExport]
  )

  const handleToggleAll = useCallback(() => {
    if (query.trim()) {
      selection.toggleVisible(filteredPlayers)
      return
    }
    selection.toggleAll()
  }, [query, filteredPlayers, selection])

  const handleConfirmClearAll = useCallback(async () => {
    try {
      await clearAllPlayers({ identity, realm, position }).unwrap()
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_FAILURE)
    }
    setClearOpen(false)
  }, [clearAllPlayers, identity, realm, position, track])

  usePageViewTracking({
    name: t('page.storage.players.title'),
    properties: { section: 'storage_players', realm: realm ?? undefined, position: position ?? undefined }
  })

  const hasPlayers = playerAddresses.length > 0
  const everyVisibleSelected = filteredPlayers.length > 0 && filteredPlayers.every(selection.isSelected)
  const selectAllChecked = selection.allSelected || everyVisibleSelected
  const selectAllIndeterminate = !selectAllChecked && filteredPlayers.some(selection.isSelected)

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.players.title')}</title>
      </Helmet>
      <SectionHeader>
        <h2>{t('component.storage.player_page.title')}</h2>
        <SectionActions>
          {hasPlayers ? (
            <FormControlLabel
              control={<Checkbox checked={selectAllChecked} indeterminate={selectAllIndeterminate} onChange={handleToggleAll} />}
              label={t('component.storage.common.select_all')}
            />
          ) : null}
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
          {hasPlayers ? (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
              {t('component.storage.player_page.clear_all_players')}
            </Button>
          ) : null}
        </SectionActions>
      </SectionHeader>
      {errorKey ? (
        <ExportAlert severity="error" onClose={clearError}>
          {t(errorKey)}
        </ExportAlert>
      ) : null}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('component.storage.player_page.description')}
      </Typography>

      <SearchField
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        placeholder={t('component.storage.player_page.search_players')}
      />

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress aria-label={t('component.storage.player_page.loading_players')} />
        </Box>
      ) : filteredPlayers.length === 0 ? (
        <Typography color="text.secondary">
          {query ? t('component.storage.player_page.no_search_results', { query }) : t('component.storage.player_page.no_players')}
        </Typography>
      ) : (
        <CardsGrid>
          {filteredPlayers.map(address => (
            <PlayerCard
              key={address}
              address={address}
              displayName={profileNames.get(address.toLowerCase())}
              onClick={() => handleSelectPlayer(address)}
              selected={selection.isSelected(address)}
              onToggle={selection.toggle}
            />
          ))}
        </CardsGrid>
      )}

      <ConfirmDialog
        open={clearOpen}
        title={t('component.storage.player_page.clear_all_dialog.title')}
        message={t('component.storage.player_page.clear_all_dialog.message')}
        confirmLabel={t('component.storage.common.confirm')}
        cancelLabel={t('component.storage.common.cancel')}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setClearOpen(false)}
      />
    </StorageLayout>
  )
}

function PlayersPage() {
  const { address } = useAuthIdentity()
  return <PlayersPageContent key={address?.toLowerCase() ?? 'anon'} />
}

export { PlayersPage }

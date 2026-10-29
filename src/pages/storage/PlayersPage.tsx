import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Box, Checkbox, CircularProgress, FormControlLabel, Typography } from 'decentraland-ui2'
import { BulkActions } from '../../components/storage/BulkActions'
import { BulkDeleteDialog } from '../../components/storage/BulkDeleteDialog'
import { PlayerCard } from '../../components/storage/PlayerCard'
import { SearchField } from '../../components/storage/SearchField'
import { StorageEmptyState } from '../../components/storage/StorageEmptyState'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useGetProfileNames } from '../../features/profile/profile.client'
import { useClearAllPlayersMutation, useClearPlayerMutation, useListPlayersQuery } from '../../features/storage'
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
  const [clearPlayer] = useClearPlayerMutation()

  const [query, setQuery] = useState('')

  const playerAddresses = useMemo(() => players ?? [], [players])
  const profileNames = useGetProfileNames(playerAddresses)
  const selection = useSelection(playerAddresses, `${realm ?? ''}:${position ?? ''}`)
  const { startExport, busy } = useStorageExport()
  const confirmLeave = useLeaveGuard(busy)

  const bulkDelete = useBulkDelete({
    selection,
    deleteOne: address => clearPlayer({ identity, realm, position, address }).unwrap(),
    clearAll: () => clearAllPlayers({ identity, realm, position }).unwrap(),
    onResult: ({ allSelected, ok, count }) => {
      if (allSelected) {
        track(ok ? SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_SUCCESS : SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_FAILURE)
      } else {
        track(ok ? SegmentEvent.STORAGE_PLAYER_CLEAR_SUCCESS : SegmentEvent.STORAGE_PLAYER_CLEAR_FAILURE, { count })
      }
    }
  })

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
      confirmLeave(() => navigate({ pathname: `/storage/players/${address}`, search: window.location.search }))
    },
    [confirmLeave, navigate]
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
          <BulkActions
            variant="button"
            allSelected={selection.allSelected}
            count={selection.count}
            busy={busy}
            onDownload={handleExportSelected}
            onDelete={bulkDelete.request}
          />
        </SectionActions>
      </SectionHeader>
      {bulkDelete.errorKey ? (
        <ExportAlert severity="error" onClose={bulkDelete.clearError}>
          {t(bulkDelete.errorKey)}
        </ExportAlert>
      ) : null}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('component.storage.player_page.description')}
      </Typography>

      {hasPlayers ? (
        <SearchField
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder={t('component.storage.player_page.search_players')}
        />
      ) : null}

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress aria-label={t('component.storage.player_page.loading_players')} />
        </Box>
      ) : filteredPlayers.length === 0 ? (
        <StorageEmptyState
          label={
            hasPlayers ? t('component.storage.player_page.no_search_results', { query }) : t('component.storage.player_page.no_players')
          }
        />
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

      <BulkDeleteDialog
        open={bulkDelete.open}
        pending={bulkDelete.pending}
        allSelected={selection.allSelected}
        count={selection.count}
        clearTitle={t('component.storage.player_page.clear_all_dialog.title')}
        clearMessage={t('component.storage.player_page.clear_all_dialog.message')}
        onConfirm={bulkDelete.confirm}
        onCancel={bulkDelete.cancel}
      />
    </StorageLayout>
  )
}

function PlayersPage() {
  const { address } = useAuthIdentity()
  return <PlayersPageContent key={address?.toLowerCase() ?? 'anon'} />
}

export { PlayersPage }

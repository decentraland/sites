import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import type { AuthIdentity } from '@dcl/crypto'
import { Box, Button, CircularProgress, Typography } from 'decentraland-ui2'
import { useGetProfileNames } from '../../../features/profile/profile.client'
import { useClearAllPlayersMutation, useListPlayersQuery } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { usePagination } from '../../../hooks/usePagination'
import { useStorageTrack } from '../../../hooks/useStorageTrack'
import { SegmentEvent } from '../../../modules/segment.types'
import { ConfirmDialog } from '../ConfirmDialog'
import { PlayerCard } from '../PlayerCard'
import { SearchField } from '../SearchField'
import { GRID_PAGE_SIZES, StoragePagination } from '../StoragePagination'
import { CardsGrid, HeaderActions, SearchSlot, SectionHeader } from './managers.styled'

interface PlayersManagerProps {
  identity: AuthIdentity | undefined
  realm: string | null
  position: string | null
  // Each surface decides where a player tap goes (storage detail route vs.
  // creators detail), so the manager stays navigation-agnostic.
  onSelectPlayer: (address: string) => void
}

// Player storage browser. Extracted from PlayersPage so `/storage/*` and the
// creators world dashboard share one implementation (rule 4).
function PlayersManager(props: PlayersManagerProps) {
  const { identity, realm, position, onSelectPlayer } = props
  const t = useFormatMessage()
  const track = useStorageTrack()

  const { data: players, isLoading } = useListPlayersQuery({ identity, realm, position }, { skip: !identity })
  const [clearAllPlayers] = useClearAllPlayersMutation()

  const [query, setQuery] = useState('')
  const [clearOpen, setClearOpen] = useState(false)

  const playerAddresses = useMemo(() => players ?? [], [players])
  const profileNames = useGetProfileNames(playerAddresses)

  const filteredPlayers = useMemo(() => {
    if (!query.trim()) return playerAddresses
    const needle = query.trim().toLowerCase()
    return playerAddresses.filter(address => {
      if (address.toLowerCase().includes(needle)) return true
      const name = profileNames.get(address.toLowerCase())
      return name ? name.toLowerCase().includes(needle) : false
    })
  }, [playerAddresses, query, profileNames])

  const {
    page,
    rowsPerPage,
    paginated: pagedPlayers,
    onPageChange,
    onRowsPerPageChange
  } = usePagination(filteredPlayers, GRID_PAGE_SIZES[0])

  const handleConfirmClearAll = useCallback(async () => {
    try {
      await clearAllPlayers({ identity, realm, position }).unwrap()
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_FAILURE)
    }
    setClearOpen(false)
  }, [clearAllPlayers, identity, realm, position, track])

  const hasPlayers = playerAddresses.length > 0

  return (
    <Box>
      <SectionHeader>
        <h2>{t('component.storage.player_page.title')}</h2>
        <HeaderActions>
          {hasPlayers ? (
            <SearchSlot>
              <SearchField
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onClear={() => setQuery('')}
                placeholder={t('component.storage.player_page.search_players')}
              />
            </SearchSlot>
          ) : null}
          {hasPlayers ? (
            <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
              {t('component.storage.player_page.clear_all_players')}
            </Button>
          ) : null}
        </HeaderActions>
      </SectionHeader>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('component.storage.player_page.description')}
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress aria-label={t('component.storage.player_page.loading_players')} />
        </Box>
      ) : filteredPlayers.length === 0 ? (
        <Typography color="text.secondary">
          {query ? t('component.storage.player_page.no_search_results', { query }) : t('component.storage.player_page.no_players')}
        </Typography>
      ) : (
        <>
          <CardsGrid>
            {pagedPlayers.map(address => (
              <PlayerCard
                key={address}
                address={address}
                displayName={profileNames.get(address.toLowerCase())}
                onClick={() => onSelectPlayer(address)}
              />
            ))}
          </CardsGrid>
          <StoragePagination
            count={filteredPlayers.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={GRID_PAGE_SIZES}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </>
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
    </Box>
  )
}

export { PlayersManager }
export type { PlayersManagerProps }

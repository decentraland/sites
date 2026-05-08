import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { Box, Button, CircularProgress, Typography } from 'decentraland-ui2'
import { ConfirmDialog } from '../../components/storage/ConfirmDialog'
import { PlayerCard } from '../../components/storage/PlayerCard'
import { SearchField } from '../../components/storage/SearchField'
import { StorageLayout } from '../../components/storage/StorageLayout'
import { useGetProfileNames } from '../../features/profile/profile.client'
import { useClearAllPlayersMutation, useListPlayersQuery } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { useStorageScope } from '../../hooks/useStorageScope'
import { useStorageTrack } from '../../hooks/useStorageTrack'
import { SegmentEvent } from '../../modules/segment.types'
import { CardsGrid } from './SelectPage.styled'
import { SectionHeader } from './shared.styled'

function PlayersPage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { identity } = useAuthIdentity()
  const { realm, position } = useStorageScope()
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

  const handleSelectPlayer = useCallback(
    (address: string) => {
      navigate({ pathname: `/storage/players/${address}`, search: window.location.search })
    },
    [navigate]
  )

  const handleConfirmClearAll = useCallback(async () => {
    try {
      await clearAllPlayers({ identity, realm, position }).unwrap()
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_SUCCESS)
    } catch {
      track(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_FAILURE)
    }
    setClearOpen(false)
  }, [clearAllPlayers, identity, realm, position, track])

  useBlogPageTracking({
    name: t('page.storage.players.title'),
    properties: { section: 'storage_players', realm: realm ?? undefined, position: position ?? undefined }
  })

  const hasPlayers = playerAddresses.length > 0

  return (
    <StorageLayout>
      <Helmet>
        <title>{t('page.storage.players.title')}</title>
      </Helmet>
      <SectionHeader>
        <h2>{t('component.storage.player_page.title')}</h2>
        {hasPlayers ? (
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setClearOpen(true)}>
            {t('component.storage.player_page.clear_all_players')}
          </Button>
        ) : null}
      </SectionHeader>

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

export { PlayersPage }

import { useCallback, useMemo, useState } from 'react'
import type { ChangeEvent, SyntheticEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Tab, Tabs, Typography } from 'decentraland-ui2'
import { LandCard } from '../../components/storage/LandCard'
import { SearchField } from '../../components/storage/SearchField'
import { WorldCard } from '../../components/storage/WorldCard'
import {
  getLandPosition,
  useGetContributableDomainsQuery,
  useGetUserDCLNamesQuery,
  useGetUserLandsQuery,
  useGetUserRentalsQuery
} from '../../features/storage'
import type { Land, World } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { useStorageRedirect } from '../../hooks/useStorageRedirect'
import { CardsGrid, EmptyState, SelectPageContainer } from './SelectPage.styled'

function SelectPage() {
  useStorageRedirect()
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { identity, address } = useAuthIdentity()
  const [activeTab, setActiveTab] = useState(0)
  const [worldsQuery, setWorldsQuery] = useState('')
  const [landsQuery, setLandsQuery] = useState('')

  const { data: contributableDomains, isLoading: domainsLoading } = useGetContributableDomainsQuery({ identity }, { skip: !identity })
  const { data: dclNames, isLoading: namesLoading } = useGetUserDCLNamesQuery({ address: address ?? '' }, { skip: !address })
  const { data: rentals, isLoading: rentalsLoading } = useGetUserRentalsQuery({ address: address ?? '' }, { skip: !address })

  const tenantTokenIds = useMemo(() => rentals?.tenantRentals.map(rental => rental.tokenId) ?? [], [rentals])
  const lessorTokenIds = useMemo(() => rentals?.lessorRentals.map(rental => rental.tokenId) ?? [], [rentals])

  const { data: lands, isLoading: landsLoading } = useGetUserLandsQuery(
    { address: address ?? '', tenantTokenIds, lessorTokenIds },
    { skip: !address || rentalsLoading }
  )

  const allWorlds = useMemo<World[]>(() => {
    const ownerNames = new Set((dclNames ?? []).map(name => name.toLowerCase()))
    const collaboratorNames = new Set((contributableDomains ?? []).map(d => d.name.toLowerCase()))
    const merged = new Map<string, World>()
    ownerNames.forEach(name => merged.set(name, { name, role: 'owner' }))
    collaboratorNames.forEach(name => {
      if (!merged.has(name)) merged.set(name, { name, role: 'collaborator' })
    })
    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [dclNames, contributableDomains])

  const filteredWorlds = useMemo(() => {
    if (!worldsQuery.trim()) return allWorlds
    const query = worldsQuery.trim().toLowerCase()
    return allWorlds.filter(world => world.name.toLowerCase().includes(query))
  }, [allWorlds, worldsQuery])

  const filteredLands = useMemo<Land[]>(() => {
    if (!lands) return []
    if (!landsQuery.trim()) return lands
    const query = landsQuery.trim().toLowerCase()
    return lands.filter(land => land.name.toLowerCase().includes(query))
  }, [lands, landsQuery])

  const isLoading = domainsLoading || namesLoading || rentalsLoading || landsLoading

  const handleTabChange = useCallback((_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }, [])

  const handleSelectLand = useCallback(
    (land: Land) => {
      const position = getLandPosition(land)
      const search = position ? `?position=${encodeURIComponent(position)}` : ''
      navigate(`/storage/env${search}`)
    },
    [navigate]
  )

  const handleSelectWorld = useCallback(
    (worldName: string, position?: string) => {
      const params = new URLSearchParams()
      params.set('realm', worldName)
      if (position) params.set('position', position)
      navigate(`/storage/env?${params.toString()}`)
    },
    [navigate]
  )

  useBlogPageTracking({
    name: t('page.storage.select.title'),
    properties: { section: 'storage_select' }
  })

  return (
    <SelectPageContainer>
      <Helmet>
        <title>{t('page.storage.select.title')}</title>
      </Helmet>
      <Typography variant="h4" gutterBottom>
        {t('component.storage.select_page.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('component.storage.select_page.subtitle')}
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label="asset type tabs">
        <Tab
          label={`${t('component.storage.select_page.worlds')} (${allWorlds.length})`}
          id="storage-tab-0"
          aria-controls="storage-tabpanel-0"
        />
        <Tab
          label={`${t('component.storage.select_page.lands')} (${lands?.length ?? 0})`}
          id="storage-tab-1"
          aria-controls="storage-tabpanel-1"
        />
      </Tabs>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress aria-label={t('component.storage.select_page.loading')} />
        </Box>
      ) : null}

      {!isLoading && activeTab === 0 ? (
        <Box role="tabpanel" id="storage-tabpanel-0" aria-labelledby="storage-tab-0" sx={{ pt: 3 }}>
          <SearchField
            value={worldsQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWorldsQuery(e.target.value)}
            onClear={() => setWorldsQuery('')}
            placeholder={t('component.storage.select_page.search_worlds')}
          />
          {filteredWorlds.length === 0 ? (
            <EmptyState>
              {t(worldsQuery ? 'component.storage.select_page.no_search_results' : 'component.storage.select_page.no_worlds', {
                query: worldsQuery
              })}
            </EmptyState>
          ) : (
            <CardsGrid>
              {filteredWorlds.map(world => (
                <WorldCard key={world.name} world={world} onEditClick={handleSelectWorld} />
              ))}
            </CardsGrid>
          )}
        </Box>
      ) : null}

      {!isLoading && activeTab === 1 ? (
        <Box role="tabpanel" id="storage-tabpanel-1" aria-labelledby="storage-tab-1" sx={{ pt: 3 }}>
          <SearchField
            value={landsQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLandsQuery(e.target.value)}
            onClear={() => setLandsQuery('')}
            placeholder={t('component.storage.select_page.search_lands')}
          />
          {filteredLands.length === 0 ? (
            <EmptyState>
              {t(landsQuery ? 'component.storage.select_page.no_search_results' : 'component.storage.select_page.no_lands', {
                query: landsQuery
              })}
            </EmptyState>
          ) : (
            <CardsGrid>
              {filteredLands.map(land => (
                <LandCard key={land.id} land={land} onClick={() => handleSelectLand(land)} />
              ))}
            </CardsGrid>
          )}
        </Box>
      ) : null}
    </SelectPageContainer>
  )
}

export { SelectPage }

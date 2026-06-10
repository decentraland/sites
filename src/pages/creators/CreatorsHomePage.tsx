import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Button } from 'decentraland-ui2'
import { WorldCreationCard } from '../../components/creators/WorldCreationCard'
import { buildCreatorWorldPath, mergeCreatorWorlds } from '../../features/creators'
import type { CreatorWorld } from '../../features/creators'
import { useGetDiscoverWorldsByNamesQuery } from '../../features/discover'
import { useGetContributableDomainsQuery, useGetUserDCLNamesQuery } from '../../features/storage'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import { redirectToAuth } from '../../utils/authRedirect'
import {
  CardSkeleton,
  CardsGrid,
  EmptyHint,
  EmptyTitle,
  Eyebrow,
  Header,
  PageRoot,
  StateBox,
  Subtitle,
  Title
} from './CreatorsHomePage.styled'

const SKELETON_COUNT = 8

function CreatorsHomePage() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { identity, address } = useAuthIdentity()

  const { data: dclNames, isLoading: namesLoading } = useGetUserDCLNamesQuery(address ? { address } : skipToken)
  const { data: contributableDomains, isLoading: domainsLoading } = useGetContributableDomainsQuery(identity ? { identity } : skipToken)

  const worlds = useMemo<CreatorWorld[]>(() => mergeCreatorWorlds(dclNames, contributableDomains), [dclNames, contributableDomains])

  // Batch-enrich the whole grid with places-api thumbnails + live user counts
  // in a single request (rule 12 — no per-card N+1).
  const worldNames = useMemo(() => worlds.map(world => world.name), [worlds])
  const { data: enrichment } = useGetDiscoverWorldsByNamesQuery(worldNames.length ? { names: worldNames } : skipToken)

  const enrichedWorlds = useMemo<CreatorWorld[]>(() => {
    if (!enrichment?.length) return worlds
    const byName = new Map(enrichment.filter(place => place.world_name).map(place => [place.world_name!.toLowerCase(), place]))
    return worlds.map(world => {
      const place = byName.get(world.name)
      if (!place) return world
      return { ...world, thumbnail: place.image || undefined, liveUserCount: place.user_count }
    })
  }, [worlds, enrichment])

  useBlogPageTracking({ name: t('page.creators.home.title'), properties: { section: 'creators_home' } })

  const isLoading = (Boolean(address) && namesLoading) || (Boolean(identity) && domainsLoading)

  return (
    <PageRoot>
      <Helmet>
        <title>{t('page.creators.home.title')}</title>
      </Helmet>
      <Header>
        <Eyebrow>{t('page.creators.home.eyebrow')}</Eyebrow>
        <Title>{t('page.creators.home.heading')}</Title>
        <Subtitle>{t('page.creators.home.subtitle')}</Subtitle>
      </Header>

      {!address ? (
        <StateBox>
          <PublicOutlinedIcon />
          <EmptyTitle>{t('page.creators.home.not_connected_title')}</EmptyTitle>
          <EmptyHint>{t('page.creators.home.not_connected')}</EmptyHint>
          <Button variant="contained" color="primary" onClick={() => redirectToAuth('/creators')}>
            {t('page.creators.home.sign_in')}
          </Button>
        </StateBox>
      ) : isLoading ? (
        <CardsGrid aria-label={t('page.creators.home.loading')} aria-busy="true">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <CardSkeleton key={index} variant="rectangular" animation="wave" />
          ))}
        </CardsGrid>
      ) : enrichedWorlds.length === 0 ? (
        <StateBox>
          <PublicOutlinedIcon />
          <EmptyTitle>{t('page.creators.home.empty_title')}</EmptyTitle>
          <EmptyHint>{t('page.creators.home.empty')}</EmptyHint>
        </StateBox>
      ) : (
        <CardsGrid>
          {enrichedWorlds.map(world => (
            <WorldCreationCard key={world.name} world={world} onSelect={name => navigate(buildCreatorWorldPath(name))} />
          ))}
        </CardsGrid>
      )}
    </PageRoot>
  )
}

export { CreatorsHomePage }

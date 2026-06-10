/* eslint-disable @typescript-eslint/naming-convention */
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import { Box } from 'decentraland-ui2'
import { useWorldContext } from '../../../components/creators/CreatorWorldLayout'
import { buildJumpInHref } from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { truncateAddress } from '../../../features/storage'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useBlogPageTracking } from '../../../hooks/useBlogPageTracking'
import {
  ContentLabel,
  Divider,
  HeroActions,
  HeroDescription,
  HeroInfo,
  HeroMeta,
  HeroMetaItem,
  HeroRow,
  HeroTitle,
  OverviewCard,
  Thumb
} from './OverviewPage.styled'
import { InfoGrid, InfoItem, InfoKey, InfoValue, PrimaryButton } from './world.styled'

const DASH = '—'

function synthWorldPlace(worldName: string): DiscoverPlace {
  return { id: worldName, title: worldName, description: '', image: '', positions: [], owner: null, world: true, world_name: worldName }
}

function OverviewPage() {
  const t = useFormatMessage()
  const { worldName, latest, place } = useWorldContext()

  const effectivePlace = place ?? synthWorldPlace(worldName)
  const jumpInHref = useMemo(() => buildJumpInHref(effectivePlace), [effectivePlace])

  useBlogPageTracking({ name: worldName, properties: { section: 'creators_world_overview', world: worldName } })

  const thumb = latest?.thumbnailUrl || effectivePlace.image || undefined
  const description = latest?.description || effectivePlace.description
  const liveUsers = effectivePlace.user_count

  return (
    <>
      <Helmet>
        <title>{`${worldName} | ${t('page.creators.home.heading')}`}</title>
      </Helmet>

      {/* One radial card: framed thumbnail + identity, then the deployment details. */}
      <OverviewCard>
        <HeroRow>
          <Thumb $image={thumb} />
          <HeroInfo>
            <HeroTitle>{latest?.title || worldName}</HeroTitle>
            <HeroMeta>
              <HeroMetaItem>
                <PublicRoundedIcon />
                {worldName}
              </HeroMetaItem>
              {typeof liveUsers === 'number' ? (
                <HeroMetaItem>
                  <PeopleAltOutlinedIcon />
                  {t('page.creators.world.live_now', { count: liveUsers })}
                </HeroMetaItem>
              ) : null}
            </HeroMeta>
            {description ? <HeroDescription>{description}</HeroDescription> : null}
            <HeroActions>
              <PrimaryButton disableRipple onClick={() => (window.location.href = jumpInHref)}>
                {t('page.creators.world.jump_in')}
              </PrimaryButton>
            </HeroActions>
          </HeroInfo>
        </HeroRow>

        <Divider />

        <Box>
          <ContentLabel>{t('page.creators.world.deployment')}</ContentLabel>
          <InfoGrid>
            <InfoItem>
              <InfoKey>{t('page.creators.world.updated')}</InfoKey>
              <InfoValue>{latest?.deployedAt ? new Date(latest.deployedAt).toLocaleString() : DASH}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoKey>{t('page.creators.world.deployer')}</InfoKey>
              <InfoValue>{latest?.deployer ? truncateAddress(latest.deployer) : DASH}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoKey>{t('page.creators.world.deploys.entity')}</InfoKey>
              <InfoValue>
                <code>{latest?.entityId ?? DASH}</code>
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoKey>{t('page.creators.world.stat.parcels')}</InfoKey>
              <InfoValue>{latest ? String(latest.parcelCount) : DASH}</InfoValue>
            </InfoItem>
          </InfoGrid>
        </Box>
      </OverviewCard>
    </>
  )
}

export { OverviewPage }

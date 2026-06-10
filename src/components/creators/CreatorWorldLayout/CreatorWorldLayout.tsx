import { useMemo } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BlockIcon from '@mui/icons-material/Block'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import InsightsIcon from '@mui/icons-material/Insights'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PodcastsIcon from '@mui/icons-material/Podcasts'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import StorageIcon from '@mui/icons-material/Storage'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { Button, CircularProgress } from 'decentraland-ui2'
import { CenteredBox } from '../../../App.styled'
import { useGetWorldDeploymentsQuery } from '../../../features/creators'
import { useGetDiscoverWorldByNameQuery } from '../../../features/discover'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import type { WorldOutletContext } from './world.context'
import {
  BackLink,
  MainColumn,
  NotFoundBox,
  NotFoundHint,
  NotFoundTitle,
  RailBadge,
  RailLink,
  SideRail,
  WorldPageRoot
} from './CreatorWorldLayout.styled'

// Per-world dashboard shell. Fetches the world's deployments + places-api
// metadata once, renders the routed left rail, and hands the data to each tab
// page via the Outlet context.
function CreatorWorldLayout() {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const { name } = useParams<{ name?: string }>()
  const worldName = name?.toLowerCase() ?? ''

  const { data: deployments, isLoading, isError } = useGetWorldDeploymentsQuery(worldName ? { worldName } : skipToken)
  const { data: place } = useGetDiscoverWorldByNameQuery(worldName ? { name: worldName } : skipToken)

  const context = useMemo<WorldOutletContext>(
    () => ({ worldName, deployments: deployments ?? [], latest: deployments?.[0] ?? null, place: place ?? null }),
    [worldName, deployments, place]
  )

  if (isLoading) {
    return (
      <CenteredBox>
        <CircularProgress />
      </CenteredBox>
    )
  }

  if (!worldName || isError) {
    return (
      <WorldPageRoot>
        <NotFoundBox>
          <NotFoundTitle>{t('page.creators.world.not_found.title')}</NotFoundTitle>
          <NotFoundHint>{t('page.creators.world.not_found.hint')}</NotFoundHint>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/creators')}>
            {t('page.creators.world.back')}
          </Button>
        </NotFoundBox>
      </WorldPageRoot>
    )
  }

  const base = `/creators/world/${encodeURIComponent(worldName)}`

  return (
    <WorldPageRoot>
      <SideRail aria-label={t('page.creators.world.nav_label')}>
        <BackLink onClick={() => navigate('/creators')}>
          <ArrowBackIcon />
          {t('page.creators.world.back')}
        </BackLink>
        <RailLink to={base} end>
          <ViewQuiltIcon />
          {t('page.creators.world.nav.overview')}
        </RailLink>
        <RailLink to={`${base}/preview`}>
          <PlayCircleOutlineIcon />
          {t('page.creators.world.nav.preview')}
        </RailLink>
        <RailLink to={`${base}/events`}>
          <EventOutlinedIcon />
          {t('page.creators.world.nav.events')}
        </RailLink>
        <RailLink to={`${base}/auth-server`}>
          <StorageIcon />
          {t('page.creators.world.nav.auth_server')}
        </RailLink>
        <RailLink to={`${base}/streaming`}>
          <PodcastsIcon />
          {t('page.creators.world.nav.streaming')}
        </RailLink>
        <RailLink to={`${base}/admins`}>
          <ShieldOutlinedIcon />
          {t('page.creators.world.nav.admins')}
        </RailLink>
        <RailLink to={`${base}/access`}>
          <PeopleOutlineIcon />
          {t('page.creators.world.nav.access')}
        </RailLink>
        <RailLink to={`${base}/bans`}>
          <BlockIcon />
          {t('page.creators.world.nav.bans')}
        </RailLink>
        <RailLink to={`${base}/analytics`}>
          <InsightsIcon />
          {t('page.creators.world.nav.analytics')}
          <RailBadge>{t('page.creators.world.soon')}</RailBadge>
        </RailLink>
        <RailLink to={`${base}/monetization`}>
          <AttachMoneyIcon />
          {t('page.creators.world.nav.monetization')}
          <RailBadge>{t('page.creators.world.soon')}</RailBadge>
        </RailLink>
      </SideRail>

      <MainColumn>
        <Outlet context={context} />
      </MainColumn>
    </WorldPageRoot>
  )
}

export { CreatorWorldLayout }

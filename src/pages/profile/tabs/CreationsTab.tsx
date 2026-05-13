import { useEffect, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, CatalogCard, Chip, CircularProgress } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useGetProfileCreationsQuery } from '../../../features/profile/profile.creations.client'
import type { CreationItem, CreationsCategory } from '../../../features/profile/profile.creations.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorByLine } from './OverviewTab.creator'
import { formatPriceMana, toItemNetwork, toRarity } from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import { CreationsFilters, CreationsHeader, EmptyBio, EquippedGrid, LoadingRow, ViewAllLink } from './OverviewTab.styled'

interface CreationsTabProps {
  address: string
  isOwnProfile: boolean
}

const PAGE_SIZE = 24

function buildMarketplaceUrl(item: CreationItem): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}${item.url ?? `/contracts/${item.contractAddress}/items/${item.itemId}`}`
}

function buildAccountUrl(address: string): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}/accounts/${address.toLowerCase()}`
}

function toCatalogAsset(item: CreationItem) {
  return {
    id: item.urn ?? item.id,
    url: buildMarketplaceUrl(item),
    name: item.name,
    rarity: toRarity(item.rarity),
    network: toItemNetwork(item.network),
    creator: item.creator
  }
}

function CreationsTab({ address, isOwnProfile }: CreationsTabProps) {
  const t = useFormatMessage()
  const [category, setCategory] = useState<CreationsCategory>('wearable')
  const [accumulated, setAccumulated] = useState<CreationItem[]>([])
  const [offset, setOffset] = useState(0)
  const cacheKey = `${address.toLowerCase()}|${category}`
  const [activeKey, setActiveKey] = useState(cacheKey)

  useEffect(() => {
    if (cacheKey !== activeKey) {
      setAccumulated([])
      setOffset(0)
      setActiveKey(cacheKey)
    }
  }, [cacheKey, activeKey])

  const { data, isFetching, isLoading } = useGetProfileCreationsQuery({ address, category, limit: PAGE_SIZE, offset })

  useEffect(() => {
    if (!data?.data) return
    setAccumulated(prev => {
      const seen = new Set(prev.map(i => i.id))
      const next = data.data.filter(i => !seen.has(i.id))
      return next.length === 0 ? prev : [...prev, ...next]
    })
  }, [data])

  const items = useMemo(() => (offset === 0 && !data ? [] : accumulated), [accumulated, data, offset])
  const total = data?.total ?? 0
  const canLoadMore = items.length < total && !isFetching
  const accountUrl = buildAccountUrl(address)

  const header = (
    <CreationsHeader>
      <CreationsFilters>
        <Chip
          label={t('profile.creations.filter_wearables')}
          color={category === 'wearable' ? 'primary' : 'default'}
          onClick={() => setCategory('wearable')}
          clickable
        />
        <Chip
          label={t('profile.creations.filter_emotes')}
          color={category === 'emote' ? 'primary' : 'default'}
          onClick={() => setCategory('emote')}
          clickable
        />
      </CreationsFilters>
      <ViewAllLink href={accountUrl} target="_blank" rel="noopener noreferrer">
        {t('profile.creations.view_all')}
        <ChevronRightIcon fontSize="small" />
      </ViewAllLink>
    </CreationsHeader>
  )

  if (isLoading && items.length === 0) {
    return (
      <>
        {header}
        <LoadingRow>
          <CircularProgress size={28} />
        </LoadingRow>
      </>
    )
  }

  if (!isLoading && items.length === 0) {
    return (
      <>
        {header}
        <EmptyBio sx={{ mt: 1 }}>{t(isOwnProfile ? 'profile.creations.empty_owner' : 'profile.creations.empty_member')}</EmptyBio>
      </>
    )
  }

  return (
    <>
      {header}
      <EquippedGrid sx={{ mt: 0 }}>
        {items.map(item => {
          const marketplaceUrl = buildMarketplaceUrl(item)
          const rawPrice = item.price && item.price !== '0' ? item.price : item.minListingPrice
          const price = formatPriceMana(rawPrice)
          const wearableData = item.data?.wearable ?? item.data?.emote
          return (
            <Box key={item.id}>
              <CatalogCard
                asset={toCatalogAsset(item)}
                imageSrc={item.thumbnail}
                action={null}
                extraInformation={null}
                price={price}
                notForSale={!price}
                withShadow={false}
                hoverShadow="glow"
                creatorSlot={<CreatorByLine address={item.creator} />}
                infoBadges={
                  <WearableInfoBadges
                    category={wearableData?.category}
                    bodyShapes={wearableData?.bodyShapes}
                    isSmart={wearableData?.isSmart}
                  />
                }
                bottomAction={
                  <Button fullWidth variant="contained" color="primary" href={marketplaceUrl} target="_blank" rel="noopener noreferrer">
                    {t('profile.overview.buy')}
                  </Button>
                }
              />
            </Box>
          )
        })}
      </EquippedGrid>
      {canLoadMore ? (
        <LoadingRow sx={{ justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setOffset(items.length)} disabled={isFetching}>
            {t('profile.creations.load_more')}
          </Button>
        </LoadingRow>
      ) : null}
      {isFetching && items.length > 0 ? (
        <LoadingRow sx={{ justifyContent: 'center' }}>
          <CircularProgress size={22} />
        </LoadingRow>
      ) : null}
    </>
  )
}

export { CreationsTab }
export type { CreationsTabProps }

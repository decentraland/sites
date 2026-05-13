import { useEffect, useMemo, useState } from 'react'
import { Box, Button, CatalogCard, Chip, CircularProgress, Typography } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import type { AssetCategory, AssetEntry } from '../../../features/profile/profile.assets.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { formatPriceMana, toItemNetwork, toRarity } from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import { CreationsFilters, CreationsHeader, EmptyBio, EquippedGrid, LoadingRow } from './OverviewTab.styled'

interface AssetsTabProps {
  address: string
}

interface CategoryOption {
  value: AssetCategory | 'all'
  labelKey: string
}

const CATEGORY_FILTERS: CategoryOption[] = [
  { value: 'all', labelKey: 'profile.assets.filter_all' },
  { value: 'wearable', labelKey: 'profile.assets.filter_wearables' },
  { value: 'emote', labelKey: 'profile.assets.filter_emotes' },
  { value: 'ens', labelKey: 'profile.assets.filter_names' },
  { value: 'parcel', labelKey: 'profile.assets.filter_lands' },
  { value: 'estate', labelKey: 'profile.assets.filter_estates' }
]

const PAGE_SIZE = 24

function buildMarketplaceUrl(entry: AssetEntry): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}${entry.nft.url ?? `/contracts/${entry.nft.contractAddress}/tokens/${entry.nft.tokenId}`}`
}

function toCatalogAsset(entry: AssetEntry) {
  const { nft } = entry
  const wearableData = nft.data?.wearable ?? nft.data?.emote
  return {
    id: nft.id,
    url: buildMarketplaceUrl(entry),
    name: nft.name,
    rarity: toRarity(wearableData?.rarity),
    network: toItemNetwork(nft.network),
    creator: nft.owner
  }
}

function AssetsTab({ address }: AssetsTabProps) {
  const t = useFormatMessage()
  const [category, setCategory] = useState<AssetCategory | 'all'>('all')
  const [offset, setOffset] = useState(0)
  const [accumulated, setAccumulated] = useState<AssetEntry[]>([])
  const cacheKey = `${address.toLowerCase()}|${category}`
  const [activeKey, setActiveKey] = useState(cacheKey)

  useEffect(() => {
    if (cacheKey !== activeKey) {
      setAccumulated([])
      setOffset(0)
      setActiveKey(cacheKey)
    }
  }, [cacheKey, activeKey])

  const { data, isFetching, isLoading } = useGetProfileAssetsQuery({
    address,
    category: category === 'all' ? undefined : category,
    limit: PAGE_SIZE,
    offset
  })

  useEffect(() => {
    if (!data?.data) return
    setAccumulated(prev => {
      const seen = new Set(prev.map(e => e.nft.id))
      const next = data.data.filter(e => !seen.has(e.nft.id))
      return next.length === 0 ? prev : [...prev, ...next]
    })
  }, [data])

  const items = useMemo(() => (offset === 0 && !data ? [] : accumulated), [accumulated, data, offset])
  const total = data?.total ?? 0
  const canLoadMore = items.length < total && !isFetching

  const header = (
    <CreationsHeader>
      <CreationsFilters>
        {CATEGORY_FILTERS.map(option => (
          <Chip
            key={option.value}
            label={t(option.labelKey)}
            color={category === option.value ? 'primary' : 'default'}
            variant={category === option.value ? 'filled' : 'outlined'}
            onClick={() => setCategory(option.value)}
            clickable
          />
        ))}
      </CreationsFilters>
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
        <EmptyBio sx={{ mt: 1 }}>{t('profile.assets.empty_description')}</EmptyBio>
      </>
    )
  }

  return (
    <>
      {header}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.assets.count', { count: total })}
      </Typography>
      <EquippedGrid sx={{ mt: 0 }}>
        {items.map(entry => {
          const { nft, order } = entry
          const marketplaceUrl = buildMarketplaceUrl(entry)
          const price = formatPriceMana(order?.price)
          const wearableData = nft.data?.wearable ?? nft.data?.emote
          return (
            <Box key={nft.id}>
              <CatalogCard
                asset={toCatalogAsset(entry)}
                imageSrc={nft.image}
                action={null}
                extraInformation={null}
                price={price}
                notForSale={!price}
                withShadow={false}
                infoBadges={
                  <WearableInfoBadges
                    category={wearableData?.category}
                    bodyShapes={wearableData?.bodyShapes}
                    isSmart={wearableData?.isSmart}
                  />
                }
                bottomAction={
                  <Button fullWidth variant="contained" color="primary" href={marketplaceUrl} target="_blank" rel="noopener noreferrer">
                    {t('profile.assets.view')}
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

export { AssetsTab }
export type { AssetsTabProps }

import { useEffect, useMemo, useState } from 'react'
/* eslint-disable @typescript-eslint/naming-convention */
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded'
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined'
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
/* eslint-enable @typescript-eslint/naming-convention */
import { Box, Button, CircularProgress, Typography } from 'decentraland-ui2'
import { CatalogCard } from '../../../components/profile/CatalogCard'
import { getEnv } from '../../../config/env'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import type { AssetCategory, AssetEntry } from '../../../features/profile/profile.assets.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { formatPriceMana, toItemNetwork, toRarity } from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import {
  AssetFilterChip,
  AssetsFilters,
  AssetsHeader,
  NameActions,
  NameCard,
  NameLabel,
  NameLogoTile,
  NameRow,
  NameSuffix
} from './AssetsTab.styled'
import { EmptyBio, EquippedGrid, LoadingRow } from './OverviewTab.styled'

interface AssetsTabProps {
  address: string
}

interface CategoryOption {
  value: AssetCategory
  labelKey: string
  icon: React.ReactNode
}

const CATEGORY_FILTERS: CategoryOption[] = [
  { value: 'wearable', labelKey: 'profile.assets.filter_wearables', icon: <CheckroomOutlinedIcon /> },
  { value: 'emote', labelKey: 'profile.assets.filter_emotes', icon: <EmojiEmotionsOutlinedIcon /> },
  { value: 'ens', labelKey: 'profile.assets.filter_names', icon: <AlternateEmailRoundedIcon /> },
  { value: 'parcel', labelKey: 'profile.assets.filter_lands', icon: <MapOutlinedIcon /> },
  { value: 'estate', labelKey: 'profile.assets.filter_estates', icon: <LandscapeOutlinedIcon /> }
]

const PAGE_SIZE = 24

function buildMarketplaceUrl(entry: AssetEntry): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}${entry.nft.url ?? `/contracts/${entry.nft.contractAddress}/tokens/${entry.nft.tokenId}`}`
}

function buildBuilderNameUrl(name: string): string {
  const base = (getEnv('BUILDER_URL') ?? 'https://decentraland.org/builder').replace(/\/+$/, '')
  return `${base}/names/${encodeURIComponent(name)}`
}

function buildMarketplaceTransferUrl(entry: AssetEntry): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}/contracts/${entry.nft.contractAddress}/tokens/${entry.nft.tokenId}/transfer`
}

// ENS name NFTs publish their full name in `nft.name` already (e.g. "Brai" or
// "Brai.dcl.eth"). The builder URL expects just the base name without suffix.
function nameStem(rawName: string): string {
  return rawName.replace(/\.dcl\.eth$/i, '').trim()
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

/**
 * Probe each individual category with `limit:1` so we can hide filter chips for
 * categories that have zero items for this owner. Mirrors the pattern used by
 * `useProfileTabAvailability` for top-level profile tabs. RTK Query dedupes the
 * 5 requests across renders.
 */
function useAvailableCategories(address: string): Set<AssetCategory> {
  // We MUST call hooks in a stable order — list each probe explicitly.
  const wearable = useGetProfileAssetsQuery({ address, category: 'wearable', limit: 1 })
  const emote = useGetProfileAssetsQuery({ address, category: 'emote', limit: 1 })
  const ens = useGetProfileAssetsQuery({ address, category: 'ens', limit: 1 })
  const parcel = useGetProfileAssetsQuery({ address, category: 'parcel', limit: 1 })
  const estate = useGetProfileAssetsQuery({ address, category: 'estate', limit: 1 })
  return useMemo(() => {
    const set = new Set<AssetCategory>()
    if ((wearable.data?.total ?? 0) > 0) set.add('wearable')
    if ((emote.data?.total ?? 0) > 0) set.add('emote')
    if ((ens.data?.total ?? 0) > 0) set.add('ens')
    if ((parcel.data?.total ?? 0) > 0) set.add('parcel')
    if ((estate.data?.total ?? 0) > 0) set.add('estate')
    return set
  }, [wearable.data?.total, emote.data?.total, ens.data?.total, parcel.data?.total, estate.data?.total])
}

function AssetsTab({ address }: AssetsTabProps) {
  const t = useFormatMessage()
  const availableCategories = useAvailableCategories(address)
  // Default to the first category that actually has items, in canonical order
  // (wearable → emote → ens → parcel → estate). Avoids landing on an empty filter.
  const firstAvailable = useMemo<AssetCategory | null>(() => {
    const order: AssetCategory[] = ['wearable', 'emote', 'ens', 'parcel', 'estate']
    return order.find(c => availableCategories.has(c)) ?? null
  }, [availableCategories])
  const [category, setCategory] = useState<AssetCategory | null>(null)
  const effectiveCategory = category ?? firstAvailable
  const [offset, setOffset] = useState(0)
  const [accumulated, setAccumulated] = useState<AssetEntry[]>([])
  const cacheKey = `${address.toLowerCase()}|${effectiveCategory ?? 'none'}`
  const [activeKey, setActiveKey] = useState(cacheKey)

  useEffect(() => {
    if (cacheKey !== activeKey) {
      setAccumulated([])
      setOffset(0)
      setActiveKey(cacheKey)
    }
  }, [cacheKey, activeKey])

  // If the currently selected category drops to zero (e.g. data refreshes),
  // clear the local pick so we fall back to the next available one.
  useEffect(() => {
    if (category && !availableCategories.has(category)) {
      setCategory(null)
    }
  }, [category, availableCategories])

  const { data, isFetching, isLoading } = useGetProfileAssetsQuery(
    {
      address,
      category: effectiveCategory ?? 'wearable',
      limit: PAGE_SIZE,
      offset
    },
    { skip: !effectiveCategory }
  )

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

  const visibleFilters = useMemo(() => CATEGORY_FILTERS.filter(option => availableCategories.has(option.value)), [availableCategories])

  const header = (
    <AssetsHeader>
      <AssetsFilters>
        {visibleFilters.map(option => {
          const active = effectiveCategory === option.value
          return (
            <AssetFilterChip
              key={option.value}
              label={t(option.labelKey)}
              icon={option.icon as React.ReactElement}
              className={active ? 'is-active' : undefined}
              onClick={() => setCategory(option.value)}
              clickable
              aria-pressed={active}
            />
          )
        })}
      </AssetsFilters>
    </AssetsHeader>
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
      {effectiveCategory === 'ens' ? (
        <NameRow>
          {items.map(entry => {
            const { nft } = entry
            const stem = nameStem(nft.name)
            const builderUrl = buildBuilderNameUrl(stem)
            const transferUrl = buildMarketplaceTransferUrl(entry)
            return (
              <NameCard key={nft.id}>
                <NameLogoTile>
                  <AlternateEmailRoundedIcon />
                </NameLogoTile>
                <NameLabel>
                  {stem}
                  <NameSuffix>.dcl.eth</NameSuffix>
                </NameLabel>
                <NameActions>
                  <Button variant="outlined" color="inherit" size="small" href={builderUrl} target="_blank" rel="noopener noreferrer">
                    {t('profile.assets.edit')}
                  </Button>
                  <Button variant="contained" color="primary" size="small" href={transferUrl} target="_blank" rel="noopener noreferrer">
                    {t('profile.assets.transfer')}
                  </Button>
                </NameActions>
              </NameCard>
            )
          })}
        </NameRow>
      ) : (
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
      )}
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

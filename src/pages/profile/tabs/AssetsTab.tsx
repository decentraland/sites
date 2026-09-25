import { useEffect, useMemo, useState } from 'react'
/* eslint-disable @typescript-eslint/naming-convention */
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded'
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined'
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
/* eslint-enable @typescript-eslint/naming-convention */
import { AssetPreviewPlayerProvider, Box, Button, CatalogCard, CircularProgress, Typography } from 'decentraland-ui2'
import { FilterChip } from '../../../components/profile/FilterChips'
import { ProfileEmptyState } from '../../../components/profile/ProfileEmptyState'
import { getEnv } from '../../../config/env'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import type { AssetCategory, AssetEntry } from '../../../features/profile/profile.assets.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { formatPriceMana, toItemNetwork, toRarity } from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import { AssetsFilters, AssetsHeader, NameActions, NameCard, NameLabel, NameLogoTile, NameRow, NameSuffix } from './AssetsTab.styled'
import { EmptyBio, EquippedGrid, LoadingRow } from './OverviewTab.styled'

interface AssetsTabProps {
  address: string
  isOwnProfile: boolean
  /** True when rendered inside the profile modal — lifts the hover preview above the dialog. */
  embedded?: boolean
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

function AssetsTab({ address, isOwnProfile, embedded = false }: AssetsTabProps) {
  const t = useFormatMessage()
  // NOTE: Show all categories by default. The previous category-availability gate
  // issued five owner-filtered requests on every visit (SITES-2SE). The marketplace
  // API has no category-count aggregation, so one unfiltered page is the only
  // accurate way to start without an N+1 request burst.
  const [selectedAddress, setSelectedAddress] = useState(address)
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null)
  const category = selectedAddress === address ? selectedCategory : null
  const selectCategory = (value: AssetCategory | null) => {
    setSelectedAddress(address)
    setSelectedCategory(value)
  }
  const [offset, setOffset] = useState(0)
  const [accumulated, setAccumulated] = useState<AssetEntry[]>([])
  const cacheKey = `${address.toLowerCase()}|${category ?? 'all'}`
  const [activeKey, setActiveKey] = useState(cacheKey)
  const queryOffset = cacheKey === activeKey ? offset : 0

  useEffect(() => {
    if (cacheKey !== activeKey) {
      setAccumulated([])
      setOffset(0)
      setActiveKey(cacheKey)
    }
  }, [cacheKey, activeKey])

  const { currentData, isFetching, isLoading } = useGetProfileAssetsQuery({
    address,
    category: category ?? undefined,
    limit: PAGE_SIZE,
    offset: queryOffset
  })

  useEffect(() => {
    if (!currentData?.data) return
    setAccumulated(prev => {
      const seen = new Set(prev.map(e => e.nft.id))
      const next = currentData.data.filter(e => !seen.has(e.nft.id))
      return next.length === 0 ? prev : [...prev, ...next]
    })
  }, [currentData])

  const items = useMemo(
    () => (cacheKey !== activeKey || (queryOffset === 0 && !currentData) ? [] : accumulated),
    [cacheKey, activeKey, accumulated, currentData, queryOffset]
  )
  const total = currentData?.total ?? 0
  const canLoadMore = items.length < total && !isFetching

  // Live previews on hover (ui2 AssetPreviewPlayer, one shared iframe): the avatar plays
  // hovered emotes and wears hovered wearables. Names / LAND have nothing to preview, so
  // those categories never pay the iframe boot cost.
  const peerUrl = getEnv('PEER_URL') ?? undefined
  const marketplaceServerUrl = (getEnv('MARKETPLACE_API_URL') ?? '').replace(/\/v2\/?$/, '') || undefined
  const isPreviewDev = Boolean(peerUrl?.includes('.zone'))
  const canHoverPreview =
    category === 'wearable' ||
    category === 'emote' ||
    (category === null && items.some(entry => entry.nft.category === 'wearable' || entry.nft.category === 'emote'))

  const header = (
    <AssetsHeader>
      <AssetsFilters>
        <FilterChip
          label={t('profile.assets.filter_all')}
          $active={category === null}
          onClick={() => selectCategory(null)}
          clickable
          aria-pressed={category === null}
        />
        {CATEGORY_FILTERS.map(option => {
          const active = category === option.value
          return (
            <FilterChip
              key={option.value}
              label={t(option.labelKey)}
              icon={option.icon as React.ReactElement}
              $active={active}
              onClick={() => selectCategory(option.value)}
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
    const marketplaceUrl = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
    return (
      <>
        {header}
        {category !== null ? (
          <EmptyBio sx={{ mt: 1 }}>{t('profile.assets.count', { count: 0 })}</EmptyBio>
        ) : isOwnProfile ? (
          <ProfileEmptyState
            icon={<CheckroomOutlinedIcon />}
            title={t('profile.assets.empty_title')}
            subtitle={t('profile.assets.empty_owner_subtitle')}
            action={{ label: t('profile.assets.empty_owner_cta'), href: marketplaceUrl }}
          />
        ) : (
          <EmptyBio sx={{ mt: 1 }}>{t('profile.assets.empty_description')}</EmptyBio>
        )}
      </>
    )
  }

  return (
    <AssetPreviewPlayerProvider
      enabled={canHoverPreview}
      peerUrl={peerUrl}
      marketplaceServerUrl={marketplaceServerUrl}
      profile={address}
      dev={isPreviewDev}
      // Standalone page: leave the default (below the fixed navbar). Inside the profile
      // modal the cards live above the dialog (z 1300), so lift the preview over it.
      overlayZIndex={embedded ? 1600 : undefined}
    >
      {header}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.assets.count', { count: total })}
      </Typography>
      {category === 'ens' ? (
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
                  hoverPreviewUrn={canHoverPreview && (nft.category === 'wearable' || nft.category === 'emote') ? nft.urn : undefined}
                  imageSrc={nft.image}
                  action={null}
                  extraInformation={null}
                  price={price}
                  notForSale={!price}
                  withShadow={false}
                  hoverShadow="glow"
                  infoBadges={
                    <WearableInfoBadges
                      category={wearableData?.category}
                      bodyShapes={wearableData?.bodyShapes}
                      isSmart={wearableData?.isSmart}
                    />
                  }
                  bottomAction={
                    category === null && nft.category === 'ens' ? (
                      <NameActions>
                        <Button
                          variant="outlined"
                          color="inherit"
                          size="small"
                          href={buildBuilderNameUrl(nameStem(nft.name))}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('profile.assets.edit')}
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          href={buildMarketplaceTransferUrl(entry)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('profile.assets.transfer')}
                        </Button>
                      </NameActions>
                    ) : (
                      <Button fullWidth variant="contained" color="primary" href={marketplaceUrl} target="_blank" rel="noopener noreferrer">
                        {t('profile.assets.view')}
                      </Button>
                    )
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
    </AssetPreviewPlayerProvider>
  )
}

export { AssetsTab }
export type { AssetsTabProps }

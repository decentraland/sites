import { useEffect, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined'
import { AssetPreviewPlayerProvider, Button, CatalogCard, CircularProgress } from 'decentraland-ui2'
import { FilterChip } from '../../../components/profile/FilterChips'
import { getEnv } from '../../../config/env'
import { useGetProfileCreationsQuery } from '../../../features/profile/profile.creations.client'
import type { CreationItem, CreationsCategory } from '../../../features/profile/profile.creations.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { isShopCategory, shopItemUrl } from '../../../utils/shopUrl'
import { CreatorByLine } from './OverviewTab.creator'
import { formatPriceMana, toItemNetwork, toRarity } from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import { CreationsFilters, CreationsHeader, EmptyBio, EquippedCardLink, EquippedGrid, LoadingRow, ViewAllLink } from './OverviewTab.styled'

interface CreationsTabProps {
  address: string
  isOwnProfile: boolean
  /** True when rendered inside the profile modal — lifts the hover preview above the dialog. */
  embedded?: boolean
}

const PAGE_SIZE = 24

function buildMarketplaceUrl(item: CreationItem): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}${item.url ?? `/contracts/${item.contractAddress}/items/${item.itemId}`}`
}

/**
 * Where a creation card goes: the Shop, which is where collectibles are browsed and bought now.
 *
 * Falls back to the Marketplace for anything the Shop has no page for. A creator's list is wearables and
 * emotes in practice, but `category` is a server-provided string, so this asks rather than assumes — a new
 * kind of creation appearing here should keep working, not become a dead link.
 */
function buildItemUrl(item: CreationItem): string {
  return isShopCategory(item.category) ? shopItemUrl(item.contractAddress, item.itemId) : buildMarketplaceUrl(item)
}

function buildAccountUrl(address: string): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}/accounts/${address.toLowerCase()}`
}

function toCatalogAsset(item: CreationItem) {
  return {
    id: item.urn ?? item.id,
    url: buildItemUrl(item),
    name: item.name,
    rarity: toRarity(item.rarity),
    network: toItemNetwork(item.network),
    creator: item.creator
  }
}

function CreationsTab({ address, isOwnProfile, embedded = false }: CreationsTabProps) {
  const t = useFormatMessage()
  const [category, setCategory] = useState<CreationsCategory>('wearable')
  // Live previews on hover (ui2 AssetPreviewPlayer, one shared iframe): the profile
  // owner's avatar plays hovered emotes and wears hovered wearables.
  const peerUrl = getEnv('PEER_URL') ?? undefined
  const marketplaceServerUrl = (getEnv('MARKETPLACE_API_URL') ?? '').replace(/\/v2\/?$/, '') || undefined
  const isPreviewDev = Boolean(peerUrl?.includes('.zone'))
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
        <FilterChip
          icon={<CheckroomOutlinedIcon />}
          label={t('profile.creations.filter_wearables')}
          $active={category === 'wearable'}
          onClick={() => setCategory('wearable')}
          clickable
          aria-pressed={category === 'wearable'}
        />
        <FilterChip
          icon={<EmojiEmotionsOutlinedIcon />}
          label={t('profile.creations.filter_emotes')}
          $active={category === 'emote'}
          onClick={() => setCategory('emote')}
          clickable
          aria-pressed={category === 'emote'}
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
    <AssetPreviewPlayerProvider
      enabled
      peerUrl={peerUrl}
      marketplaceServerUrl={marketplaceServerUrl}
      profile={address}
      dev={isPreviewDev}
      // Standalone page: leave the default (below the fixed navbar). Inside the profile
      // modal the cards live above the dialog (z 1300), so lift the preview over it.
      overlayZIndex={embedded ? 1600 : undefined}
    >
      {header}
      <EquippedGrid sx={{ mt: 0 }}>
        {items.map(item => {
          const detailUrl = buildItemUrl(item)
          // The one link that stays on the Marketplace: its label promises that app by name, and it is the
          // deliberate way out for anything the Shop does not show. Renaming it is a copy decision in six
          // locales, not a routing one.
          const marketplaceUrl = buildMarketplaceUrl(item)
          const rawPrice = item.price && item.price !== '0' ? item.price : item.minListingPrice
          const price = formatPriceMana(rawPrice)
          const wearableData = item.data?.wearable ?? item.data?.emote
          // Sold-out items with no secondary listing still need a visible signal
          // in the slot where price normally renders — the ui2 card falls back
          // to `owners` when `price` is empty, so we surface "Not for sale" there
          // instead of leaving the row blank.
          const fallbackLabel = price ? undefined : t('profile.creations.not_for_sale')
          return (
            <EquippedCardLink key={item.id} href={detailUrl} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
              <CatalogCard
                asset={toCatalogAsset(item)}
                hoverPreviewUrn={item.urn}
                imageSrc={item.thumbnail}
                action={null}
                extraInformation={null}
                price={price}
                owners={fallbackLabel}
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
                  price ? (
                    <Button fullWidth variant="contained" color="primary" href={detailUrl} target="_blank" rel="noopener noreferrer">
                      {t('profile.overview.buy')}
                    </Button>
                  ) : (
                    <Button fullWidth variant="outlined" color="inherit" href={marketplaceUrl} target="_blank" rel="noopener noreferrer">
                      {t('profile.creations.view_in_marketplace')}
                    </Button>
                  )
                }
              />
            </EquippedCardLink>
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
    </AssetPreviewPlayerProvider>
  )
}

export { CreationsTab }
export type { CreationsTabProps }

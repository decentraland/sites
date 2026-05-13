import { useEffect, useMemo, useState } from 'react'
import { Button, CatalogCard, CircularProgress, Typography } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useGetProfileCreationsQuery } from '../../../features/profile/profile.creations.client'
import type { CreationItem } from '../../../features/profile/profile.creations.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorByLine } from './OverviewTab.creator'
import { formatPriceMana, toItemNetwork, toRarity } from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import { EmptyBio, EquippedCardLink, EquippedGrid, LoadingRow } from './OverviewTab.styled'

interface CreationsTabProps {
  address: string
  isOwnProfile: boolean
}

const PAGE_SIZE = 24

function buildMarketplaceUrl(item: CreationItem): string {
  const base = (getEnv('MARKETPLACE_URL') ?? 'https://decentraland.org/marketplace').replace(/\/+$/, '')
  return `${base}${item.url ?? `/contracts/${item.contractAddress}/items/${item.itemId}`}`
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
  const [accumulated, setAccumulated] = useState<CreationItem[]>([])
  const [offset, setOffset] = useState(0)
  const [resetKey, setResetKey] = useState(address.toLowerCase())

  useEffect(() => {
    const key = address.toLowerCase()
    if (key !== resetKey) {
      setAccumulated([])
      setOffset(0)
      setResetKey(key)
    }
  }, [address, resetKey])

  const { data, isFetching, isLoading } = useGetProfileCreationsQuery({ address, limit: PAGE_SIZE, offset })

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

  if (isLoading && items.length === 0) {
    return (
      <LoadingRow>
        <CircularProgress size={28} />
      </LoadingRow>
    )
  }

  if (!isLoading && items.length === 0) {
    return <EmptyBio sx={{ mt: 1 }}>{t(isOwnProfile ? 'profile.creations.empty_owner' : 'profile.creations.empty_member')}</EmptyBio>
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.creations.count', { count: total })}
      </Typography>
      <EquippedGrid sx={{ mt: 0 }}>
        {items.map(item => {
          const marketplaceUrl = buildMarketplaceUrl(item)
          const price = formatPriceMana(item.price)
          const wearableData = item.data?.wearable ?? item.data?.emote
          return (
            <EquippedCardLink key={item.id} href={marketplaceUrl} target="_blank" rel="noopener noreferrer" aria-label={item.name}>
              <CatalogCard
                asset={toCatalogAsset(item)}
                imageSrc={item.thumbnail}
                action={null}
                extraInformation={null}
                price={price}
                notForSale={!price}
                withShadow={false}
                hoverShadow="glow"
                disableInfoExpansion
                creatorSlot={<CreatorByLine address={item.creator} />}
                infoBadges={
                  <WearableInfoBadges
                    category={wearableData?.category}
                    bodyShapes={wearableData?.bodyShapes}
                    isSmart={wearableData?.isSmart}
                  />
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
    </>
  )
}

export { CreationsTab }
export type { CreationsTabProps }

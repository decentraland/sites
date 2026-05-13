import { useMemo, useState } from 'react'
import { Box, Chip, styled } from 'decentraland-ui2'
import { NFTGrid } from '../../../components/profile/NFTGrid'
import type { NFTGridItem } from '../../../components/profile/NFTGrid'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import type { ProfileNft } from '../../../features/profile/profile.assets.client'
import type { ItemCategory } from '../../../features/profile/profile.creations.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

const FiltersRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2)
}))

const CATEGORY_FILTERS: { value: ItemCategory | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'profile.assets.filter_all' },
  { value: 'wearable', labelKey: 'profile.assets.filter_wearables' },
  { value: 'emote', labelKey: 'profile.assets.filter_emotes' },
  { value: 'name', labelKey: 'profile.assets.filter_names' },
  { value: 'land', labelKey: 'profile.assets.filter_lands' },
  { value: 'estate', labelKey: 'profile.assets.filter_estates' }
]

interface AssetsTabProps {
  address: string
}

interface ProfileNftWithRarity extends ProfileNft {
  rarity?: string
}

function toGridItem(nft: ProfileNftWithRarity): NFTGridItem {
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    subtitle: nft.network ? `${nft.category} · ${nft.network.toLowerCase()}` : nft.category,
    rarity: nft.rarity
  }
}

function AssetsTab({ address }: AssetsTabProps) {
  const t = useFormatMessage()
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')
  const { data, isLoading } = useGetProfileAssetsQuery({
    address,
    category: category === 'all' ? undefined : category
  })
  const items = useMemo<NFTGridItem[]>(() => (data?.data ?? []).map(toGridItem as (nft: ProfileNft) => NFTGridItem), [data])

  return (
    <Box>
      <FiltersRow>
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
      </FiltersRow>
      <NFTGrid
        items={items}
        isLoading={isLoading}
        emptyTitle={t('profile.assets.empty_title')}
        emptyDescription={t('profile.assets.empty_description')}
      />
    </Box>
  )
}

export { AssetsTab }
export type { AssetsTabProps }

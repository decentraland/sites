import { useMemo } from 'react'
import { NFTGrid } from '../../../components/profile/NFTGrid'
import type { NFTGridItem } from '../../../components/profile/NFTGrid'
import { useGetProfileCreationsQuery } from '../../../features/profile/profile.creations.client'
import type { ProfileItem } from '../../../features/profile/profile.creations.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface CreationsTabProps {
  address: string
  isOwnProfile: boolean
}

function toGridItem(item: ProfileItem): NFTGridItem {
  return {
    id: item.id,
    name: item.name,
    image: item.thumbnail,
    subtitle: item.rarity ? `${item.category} · ${item.rarity}` : item.category,
    rarity: item.rarity
  }
}

function CreationsTab({ address, isOwnProfile }: CreationsTabProps) {
  const t = useFormatMessage()
  const { data, isLoading } = useGetProfileCreationsQuery({ address })
  const items = useMemo<NFTGridItem[]>(() => (data?.data ?? []).map(toGridItem), [data])

  return (
    <NFTGrid
      items={items}
      isLoading={isLoading}
      emptyTitle={t('profile.creations.empty_title')}
      emptyDescription={t(isOwnProfile ? 'profile.creations.empty_owner' : 'profile.creations.empty_member')}
    />
  )
}

export { CreationsTab }
export type { CreationsTabProps }

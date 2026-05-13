import { useMemo } from 'react'
import { NFTGrid } from '../../../components/profile/NFTGrid'
import type { NFTGridItem } from '../../../components/profile/NFTGrid'
import { useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface PlacesTabProps {
  address: string
  isOwnProfile: boolean
}

function toGridItem(place: ProfilePlace): NFTGridItem {
  const pieces: string[] = []
  if (typeof place.likes === 'number') pieces.push(`${place.likes} likes`)
  if (typeof place.user_count === 'number') pieces.push(`${place.user_count} online`)
  return {
    id: place.id,
    name: place.title,
    image: place.image ?? '',
    subtitle: pieces.join(' · '),
    href: place.base_position ? `/jump/places?position=${place.base_position}` : undefined
  }
}

function PlacesTab({ address, isOwnProfile }: PlacesTabProps) {
  const t = useFormatMessage()
  const { data, isLoading } = useGetProfilePlacesQuery({ address })
  const items = useMemo<NFTGridItem[]>(() => (data?.data ?? []).map(toGridItem), [data])

  return (
    <NFTGrid
      items={items}
      isLoading={isLoading}
      emptyTitle={t('profile.places.empty_title')}
      emptyDescription={t(isOwnProfile ? 'profile.places.empty_owner' : 'profile.places.empty_member')}
    />
  )
}

export { PlacesTab }
export type { PlacesTabProps }

import { useMemo } from 'react'
import { NFTGrid } from '../../../components/profile/NFTGrid'
import type { NFTGridItem } from '../../../components/profile/NFTGrid'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'

const PAGE_OPTIONS = { limit: 24, offset: 0 } as const

interface PhotosTabProps {
  address: string
  isOwnProfile: boolean
}

function PhotosTab({ address, isOwnProfile }: PhotosTabProps) {
  const t = useFormatMessage()
  const { images, isLoading } = useReelImagesByUser(address, PAGE_OPTIONS)
  const items = useMemo<NFTGridItem[]>(
    () =>
      images.map(image => ({
        id: image.id,
        name: image.metadata?.scene?.name ?? 'Snapshot',
        image: image.thumbnailUrl || image.url,
        href: `/reels/${image.id}`
      })),
    [images]
  )

  return (
    <NFTGrid
      items={items}
      isLoading={isLoading}
      emptyTitle={t('profile.photos.empty_title')}
      emptyDescription={t(isOwnProfile ? 'profile.photos.empty_owner' : 'profile.photos.empty_member')}
    />
  )
}

export { PhotosTab }
export type { PhotosTabProps }

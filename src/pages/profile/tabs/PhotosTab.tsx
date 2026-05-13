import { useMemo } from 'react'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import { EmptyBio, LoadingRow } from './OverviewTab.styled'
import { PhotoCard, PhotoImage, PhotosGrid } from './PhotosTab.styled'

const PAGE_OPTIONS = { limit: 24, offset: 0 } as const

interface PhotosTabProps {
  address: string
  isOwnProfile: boolean
}

function PhotosTab({ address, isOwnProfile }: PhotosTabProps) {
  const t = useFormatMessage()
  const { images, isLoading, total } = useReelImagesByUser(address, PAGE_OPTIONS)
  const photos = useMemo(() => images, [images])

  if (isLoading) {
    return (
      <LoadingRow>
        <CircularProgress size={28} />
      </LoadingRow>
    )
  }

  if (photos.length === 0) {
    return <EmptyBio sx={{ mt: 1 }}>{t(isOwnProfile ? 'profile.photos.empty_owner' : 'profile.photos.empty_member')}</EmptyBio>
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.photos.count', { count: total || photos.length })}
      </Typography>
      <PhotosGrid>
        {photos.map(image => (
          <PhotoCard key={image.id} href={`/reels/${image.id}`}>
            <PhotoImage src={image.thumbnailUrl || image.url} alt={image.metadata?.scene?.name ?? 'Snapshot'} loading="lazy" />
          </PhotoCard>
        ))}
      </PhotosGrid>
    </>
  )
}

export { PhotosTab }
export type { PhotosTabProps }

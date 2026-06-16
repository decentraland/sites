import { useCallback, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { CircularProgress, DownloadModal, Typography } from 'decentraland-ui2'
import { PhotoModal } from '../../../components/profile/PhotoModal'
import { JumpInBadgeIcon, ProfileEmptyState } from '../../../components/profile/ProfileEmptyState'
import { useOpenPhotoModal } from '../../../components/profile/ProfileModal/useOpenPhotoModal'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
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
  const { identity } = useAuthIdentity()
  const { images, isLoading } = useReelImagesByUser(address, PAGE_OPTIONS, isOwnProfile ? identity : undefined)
  const photos = useMemo(() => images, [images])
  const { openImageId, open: openPhoto, close: closePhoto } = useOpenPhotoModal()
  // "Jump in" launches the desktop app (or falls back to download) — same flow as the
  // navbar — so the user can hop in-world and start snapping photos.
  const { handleClick: handleJumpIn, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()

  const handleOpen = useCallback(
    (id: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      openPhoto(id)
    },
    [openPhoto]
  )

  if (isLoading) {
    return (
      <LoadingRow>
        <CircularProgress size={28} />
      </LoadingRow>
    )
  }

  if (photos.length === 0) {
    if (!isOwnProfile) {
      return <EmptyBio sx={{ mt: 1 }}>{t('profile.photos.empty_member')}</EmptyBio>
    }
    return (
      <>
        <ProfileEmptyState
          icon={<ImageOutlinedIcon />}
          title={t('profile.photos.empty_title')}
          subtitle={t('profile.photos.empty_owner_subtitle')}
          action={{ label: t('profile.photos.empty_owner_cta'), onClick: handleJumpIn, endIcon: <JumpInBadgeIcon /> }}
        />
        <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
      </>
    )
  }

  // Show the rendered count, not the service-side `currentImages` total — the
  // unsigned listing filters out private snapshots so the server count can wildly
  // diverge from what the user actually sees on the page.
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.photos.count', { count: photos.length })}
      </Typography>
      <PhotosGrid>
        {photos.map(image => (
          <PhotoCard key={image.id} type="button" onClick={handleOpen(image.id)}>
            <PhotoImage src={image.thumbnailUrl || image.url} alt={image.metadata?.scene?.name ?? 'Snapshot'} loading="lazy" />
          </PhotoCard>
        ))}
      </PhotosGrid>
      <PhotoModal imageId={openImageId} onClose={closePhoto} />
    </>
  )
}

export { PhotosTab }
export type { PhotosTabProps }

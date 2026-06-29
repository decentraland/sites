import { memo, useCallback, useMemo, useState } from 'react'
/* eslint-disable @typescript-eslint/naming-convention */
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
/* eslint-enable @typescript-eslint/naming-convention */
import { CircularProgress, Typography } from 'decentraland-ui2'
import { FilterChip, FiltersRow } from '../../../components/profile/FilterChips'
import { PhotoModal } from '../../../components/profile/PhotoModal'
import { JumpInEmptyState } from '../../../components/profile/ProfileEmptyState'
import { useOpenPhotoModal } from '../../../components/profile/ProfileModal/useOpenPhotoModal'
import type { Image } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import { EmptyBio, LoadingRow } from './OverviewTab.styled'
import { PhotoCard, PhotoImage, PhotosGrid, PrivateBadge } from './PhotosTab.styled'

const PAGE_OPTIONS = { limit: 24, offset: 0 } as const

type PhotoVisibility = 'all' | 'public' | 'private'

interface VisibilityFilter {
  value: PhotoVisibility
  labelKey: string
  icon: React.ReactElement
}

const VISIBILITY_FILTERS: VisibilityFilter[] = [
  { value: 'all', labelKey: 'profile.photos.filter_all', icon: <PhotoLibraryOutlinedIcon /> },
  { value: 'public', labelKey: 'profile.photos.filter_public', icon: <PublicOutlinedIcon /> },
  { value: 'private', labelKey: 'profile.photos.filter_private', icon: <LockOutlinedIcon /> }
]

interface PhotosTabProps {
  address: string
  isOwnProfile: boolean
}

function PhotosTab({ address, isOwnProfile }: PhotosTabProps) {
  const t = useFormatMessage()
  const { identity } = useAuthIdentity()
  // camera-reel-service gates photo visibility by auth: signed-as-owner returns ALL images (public +
  // private, each tagged `isPublic`), unsigned returns only public ones. So we only sign the request
  // on the owner's own profile — that lets the owner filter public/private client-side below. A
  // visitor's request stays unsigned, so they can never see another user's private snapshots.
  const { images, isLoading } = useReelImagesByUser(address, PAGE_OPTIONS, isOwnProfile ? identity : undefined)
  const [visibility, setVisibility] = useState<PhotoVisibility>('public')
  const { openImageId, open: openPhoto, close: closePhoto } = useOpenPhotoModal()

  // The visibility filter only applies to the owner's signed listing. A visitor's request is
  // unsigned, so the SERVER returns public-only photos — visitor safety relies on that server
  // boundary, not on this client filter (which is bypassed for visitors).
  // NOTE: this tab loads only the first page (PAGE_OPTIONS, 24) and never paginates, so the filter
  // runs over those 24 — an owner with >24 public-first photos could see an empty Private view
  // until pagination is added (tracked as a follow-up).
  const photos = useMemo(() => {
    if (!isOwnProfile || visibility === 'all') return images
    const wantPublic = visibility === 'public'
    return images.filter(image => image.isPublic === wantPublic)
  }, [images, isOwnProfile, visibility])

  // Stable `(id, event) => void` handler — passing `(id) => (event) => ...` would build a fresh
  // closure per render and defeat the `memo()` wrap on PhotoCardItem.
  const handleOpen = useCallback(
    (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      openPhoto(id)
    },
    [openPhoto]
  )

  const filters = isOwnProfile ? (
    <FiltersRow>
      {VISIBILITY_FILTERS.map(option => {
        const active = visibility === option.value
        return (
          <FilterChip
            key={option.value}
            label={t(option.labelKey)}
            icon={option.icon}
            $active={active}
            onClick={() => setVisibility(option.value)}
            clickable
            aria-pressed={active}
          />
        )
      })}
    </FiltersRow>
  ) : null

  if (isLoading) {
    return (
      <>
        {filters}
        <LoadingRow>
          <CircularProgress size={28} />
        </LoadingRow>
      </>
    )
  }

  // No snapshots at all on the listing (not just none matching the active filter).
  if (images.length === 0) {
    if (!isOwnProfile) {
      return <EmptyBio sx={{ mt: 1 }}>{t('profile.photos.empty_member')}</EmptyBio>
    }
    return (
      <JumpInEmptyState
        icon={<ImageOutlinedIcon />}
        title={t('profile.photos.empty_title')}
        subtitle={t('profile.photos.empty_owner_subtitle')}
        ctaLabel={t('profile.photos.empty_owner_cta')}
      />
    )
  }

  return (
    <>
      {filters}
      {photos.length === 0 ? (
        <EmptyBio sx={{ mt: 1 }}>{t('profile.photos.empty_filter')}</EmptyBio>
      ) : (
        <>
          {/* Show the rendered count, not the service-side `currentImages` total — this tab loads only
              the first page (PAGE_OPTIONS) and never paginates, and the count tracks the active filter. */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('profile.photos.count', { count: photos.length })}
          </Typography>
          <PhotosGrid>
            {photos.map(image => (
              <PhotoCardItem key={image.id} image={image} isOwnProfile={isOwnProfile} onOpen={handleOpen} />
            ))}
          </PhotosGrid>
        </>
      )}
      <PhotoModal imageId={openImageId} onClose={closePhoto} />
    </>
  )
}

interface PhotoCardItemProps {
  image: Image
  isOwnProfile: boolean
  onOpen: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void
}

const PhotoCardItem = memo(function PhotoCardItem({ image, isOwnProfile, onOpen }: PhotoCardItemProps) {
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => onOpen(image.id, event), [image.id, onOpen])
  return (
    <PhotoCard type="button" onClick={handleClick}>
      <PhotoImage src={image.thumbnailUrl || image.url} alt={image.metadata?.scene?.name ?? 'Snapshot'} loading="lazy" />
      {isOwnProfile && !image.isPublic ? (
        <PrivateBadge>
          <LockOutlinedIcon fontSize="inherit" />
        </PrivateBadge>
      ) : null}
    </PhotoCard>
  )
})

export { PhotosTab }
export type { PhotosTabProps }

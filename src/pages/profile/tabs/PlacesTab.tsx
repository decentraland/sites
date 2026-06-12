import { useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { useAnalytics } from '@dcl/hooks'
import type { Avatar } from '@dcl/schemas'
import { CircularProgress, SceneCard, Typography } from 'decentraland-ui2'
import { FilterChip, FiltersRow } from '../../../components/profile/FilterChips'
import { PlaceDetailModal, useOpenPlaceModal } from '../../../components/profile/PlaceDetailModal'
import { useGetProfileFavoritePlacesQuery, useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import type { ProfileFavoritePlace, ProfilePlace } from '../../../features/profile/profile.places.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { SegmentEvent } from '../../../modules/segment'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { EmptyBio, LoadingRow } from './OverviewTab.styled'
import { PlacesGrid } from './PlacesTab.styled'

type PlacesView = 'places' | 'favorites'

/* eslint-disable @typescript-eslint/naming-convention -- mirrors ui2's JumpInTrackingData (snake_case) */
type JumpInTrackData = { type: string; url?: string; has_launcher: boolean }
/* eslint-enable @typescript-eslint/naming-convention */

interface PlacesTabProps {
  address: string
  isOwnProfile: boolean
}

function PlacesTab({ address, isOwnProfile }: PlacesTabProps) {
  const t = useFormatMessage()
  const { track } = useAnalytics()
  // Favourites only exist for the signed caller (places-api scopes `only_favorites=true` to
  // the identity), so the view switch renders on the own profile exclusively; member view
  // always shows owned places.
  const [view, setView] = useState<PlacesView>('places')
  const showFavorites = isOwnProfile && view === 'favorites'

  const owned = useGetProfilePlacesQuery({ address })
  const favorites = useGetProfileFavoritePlacesQuery(undefined, { skip: !showFavorites })
  // Owned places all belong to the profile user, so one cached profile resolves every card's
  // "by" row. Favourite places carry their own `owner_avatar` (batch-resolved by the client).
  const { avatar: profileAvatar } = useProfileAvatar(address)

  const places = useMemo<ProfileFavoritePlace[]>(
    () => (showFavorites ? favorites.data?.data ?? [] : owned.data?.data ?? []),
    [showFavorites, favorites.data, owned.data]
  )
  const isLoading = showFavorites ? favorites.isLoading : owned.isLoading

  // Place click opens a place-detail surface. Inside a profile/event modal context the
  // hook delegates so the same dialog swaps content (no modal-on-modal); standalone it
  // opens a local PlaceDetailModal below.
  const { openPlace, open: openPlaceModal, close: closePlaceModal } = useOpenPlaceModal()
  const handleSelectPlaces = useCallback(() => setView('places'), [])
  const handleSelectFavorites = useCallback(() => setView('favorites'), [])

  const handleJumpInTrack = useCallback(
    (data: JumpInTrackData) => track(SegmentEvent.GO_TO_EXPLORER, { ...data, position: 'profile-places' }),
    [track]
  )

  const filters = isOwnProfile ? (
    <FiltersRow>
      <FilterChip
        icon={<PlaceOutlinedIcon />}
        label={t('profile.places.filter_my_places')}
        $active={view === 'places'}
        onClick={handleSelectPlaces}
        clickable
        aria-pressed={view === 'places'}
      />
      <FilterChip
        icon={<FavoriteBorderIcon />}
        label={t('profile.places.filter_favorites')}
        $active={view === 'favorites'}
        onClick={handleSelectFavorites}
        clickable
        aria-pressed={view === 'favorites'}
      />
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

  if (places.length === 0) {
    const emptyKey = showFavorites
      ? 'profile.places.empty_favorites'
      : isOwnProfile
        ? 'profile.places.empty_owner'
        : 'profile.places.empty_member'
    return (
      <>
        {filters}
        <EmptyBio sx={{ mt: 1 }}>{t(emptyKey)}</EmptyBio>
      </>
    )
  }

  return (
    <>
      {filters}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.places.count', { count: places.length })}
      </Typography>
      <PlacesGrid>
        {places.map(place => (
          <SceneCard
            key={place.id}
            image={place.image ? safeCssUrl(place.image) : ''}
            sceneName={place.title}
            avatar={(place.owner_avatar ?? profileAvatar) as Avatar | undefined}
            coordinates={place.world ? place.world_name : place.base_position}
            showOnHover={['jumpInButton']}
            onJumpInTrack={handleJumpInTrack}
            onClick={() => openPlaceModal(place as ProfilePlace)}
          />
        ))}
      </PlacesGrid>
      <PlaceDetailModal place={openPlace} onClose={closePlaceModal} />
    </>
  )
}

export { PlacesTab }
export type { PlacesTabProps }

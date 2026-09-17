import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PublicIcon from '@mui/icons-material/Public'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VerifiedIcon from '@mui/icons-material/Verified'
import { useAnalytics } from '@dcl/hooks'
import type { Avatar } from '@dcl/schemas'
import { CircularProgress, SceneCard, Typography } from 'decentraland-ui2'
import { FilterChip, FiltersRow } from '../../../components/profile/FilterChips'
import { PlaceDetailModal, useOpenPlaceModal } from '../../../components/profile/PlaceDetailModal'
import { JumpInBadgeIcon, ProfileEmptyState } from '../../../components/profile/ProfileEmptyState'
import { GET_A_NAME_URL, manageWorldUrl } from '../../../components/profile/profileLinks'
import { getEnv } from '../../../config/env'
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
  const hasClaimedName = !!profileAvatar?.hasClaimedName

  const places = useMemo<ProfileFavoritePlace[]>(
    () => (showFavorites ? favorites.data?.data ?? [] : owned.data?.data ?? []),
    [showFavorites, favorites.data, owned.data]
  )
  const isLoading = showFavorites ? favorites.isLoading : owned.isLoading

  // Place click opens a place-detail surface. Inside a profile/event modal context the
  // hook delegates so the same dialog swaps content (no modal-on-modal); standalone it
  // opens a local PlaceDetailModal below.
  const { openPlace, open: openPlaceModal, close: closePlaceModal } = useOpenPlaceModal()
  const navigate = useNavigate()
  const handleSelectPlaces = useCallback(() => setView('places'), [])
  const handleSelectFavorites = useCallback(() => setView('favorites'), [])
  // "Explore places" sends the user to the in-site places browse (/whats-on);
  // the legacy /places paths already redirect there.
  const handleExplorePlaces = useCallback(() => navigate('/events'), [navigate])

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
    let emptyContent
    if (showFavorites) {
      // Favourites are scoped to the signed caller, so this branch is own-profile only.
      emptyContent = (
        <ProfileEmptyState
          icon={<FavoriteBorderIcon />}
          title={t('profile.places.empty_favorites_title')}
          subtitle={t('profile.places.empty_favorites_subtitle')}
          action={{ label: t('profile.places.empty_favorites_cta'), onClick: handleExplorePlaces, endIcon: <JumpInBadgeIcon /> }}
        />
      )
    } else if (isOwnProfile) {
      /**
       * Two different people reach this screen, and they need opposite next steps.
       *
       * Someone with no NAME needs one — it is what unlocks a World. Someone who already holds one has
       * done that part and needs to publish; telling them to go buy a NAME reads as the page not knowing
       * who they are. The profile already carries the answer, so the branch costs no extra request.
       */
      const worldsUrl = manageWorldUrl(getEnv('BUILDER_URL'))
      emptyContent = hasClaimedName ? (
        <ProfileEmptyState
          icon={<PlaceOutlinedIcon />}
          title={t('profile.places.empty_owner_title')}
          subtitle={t('profile.places.empty_owner_has_name_subtitle')}
          action={
            worldsUrl ? { label: t('profile.header.manage_world'), href: worldsUrl, startIcon: <PublicIcon /> } : undefined
          }
        />
      ) : (
        <ProfileEmptyState
          icon={<PlaceOutlinedIcon />}
          title={t('profile.places.empty_owner_title')}
          subtitle={t('profile.places.empty_owner_subtitle')}
          action={{ label: t('profile.places.empty_owner_cta'), href: GET_A_NAME_URL, startIcon: <VerifiedIcon /> }}
        />
      )
    } else {
      emptyContent = <EmptyBio sx={{ mt: 1 }}>{t('profile.places.empty_member')}</EmptyBio>
    }
    return (
      <>
        {filters}
        {emptyContent}
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

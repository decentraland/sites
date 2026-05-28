import { useCallback, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { PlaceDetailModal, useOpenPlaceModal } from '../../../components/profile/PlaceDetailModal'
import { useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { EmptyBio, LoadingRow } from './OverviewTab.styled'
import { PlaceBody, PlaceCard, PlaceImage, PlaceMeta, PlaceMetaItem, PlaceTitle, PlacesGrid } from './PlacesTab.styled'

interface PlacesTabProps {
  address: string
  isOwnProfile: boolean
}

function PlacesTab({ address, isOwnProfile }: PlacesTabProps) {
  const t = useFormatMessage()
  const { data, isLoading } = useGetProfilePlacesQuery({ address })
  const places = useMemo<ProfilePlace[]>(() => data?.data ?? [], [data])
  // Place click opens a place-detail surface. Inside a profile/event modal context the
  // hook delegates so the same dialog swaps content (no modal-on-modal); standalone it
  // opens a local PlaceDetailModal below.
  const { openPlace, open: openPlaceModal, close: closePlaceModal } = useOpenPlaceModal()
  const handleOpen = useCallback(
    (place: ProfilePlace) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      openPlaceModal(place)
    },
    [openPlaceModal]
  )

  if (isLoading) {
    return (
      <LoadingRow>
        <CircularProgress size={28} />
      </LoadingRow>
    )
  }

  if (places.length === 0) {
    return <EmptyBio sx={{ mt: 1 }}>{t(isOwnProfile ? 'profile.places.empty_owner' : 'profile.places.empty_member')}</EmptyBio>
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.places.count', { count: places.length })}
      </Typography>
      <PlacesGrid>
        {places.map(place => (
          <PlaceCard key={place.id} href="#" onClick={handleOpen(place)}>
            <PlaceImage $image={place.image ? safeCssUrl(place.image) : undefined} />
            <PlaceBody>
              <PlaceTitle>{place.title}</PlaceTitle>
              <PlaceMeta>
                {place.world && place.world_name ? (
                  <PlaceMetaItem>
                    <LanguageOutlinedIcon sx={{ fontSize: 16 }} />
                    {place.world_name}
                  </PlaceMetaItem>
                ) : place.base_position ? (
                  <PlaceMetaItem>
                    <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
                    {place.base_position}
                  </PlaceMetaItem>
                ) : null}
                {typeof place.likes === 'number' ? (
                  <PlaceMetaItem>
                    <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                    {place.likes}
                  </PlaceMetaItem>
                ) : null}
                {typeof place.user_count === 'number' && place.user_count > 0 ? (
                  <PlaceMetaItem>
                    <PersonOutlineIcon sx={{ fontSize: 16 }} />
                    {place.user_count}
                  </PlaceMetaItem>
                ) : null}
              </PlaceMeta>
            </PlaceBody>
          </PlaceCard>
        ))}
      </PlacesGrid>
      <PlaceDetailModal place={openPlace} onClose={closePlaceModal} />
    </>
  )
}

export { PlacesTab }
export type { PlacesTabProps }

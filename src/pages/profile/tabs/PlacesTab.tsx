import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { EmptyBio, LoadingRow } from './OverviewTab.styled'
import { PlaceBody, PlaceCard, PlaceImage, PlaceMeta, PlaceMetaItem, PlaceTitle, PlacesGrid } from './PlacesTab.styled'

interface PlacesTabProps {
  address: string
  isOwnProfile: boolean
}

function buildJumpHref(place: ProfilePlace): string | undefined {
  const position = place.base_position ?? place.positions?.[0]
  if (!position) return undefined
  return `/jump/places?position=${encodeURIComponent(position)}`
}

function PlacesTab({ address, isOwnProfile }: PlacesTabProps) {
  const t = useFormatMessage()
  const { data, isLoading } = useGetProfilePlacesQuery({ address })
  const places = useMemo<ProfilePlace[]>(() => data?.data ?? [], [data])

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
        {places.map(place => {
          const href = buildJumpHref(place)
          return (
            <PlaceCard key={place.id} href={href ?? '#'}>
              <PlaceImage style={place.image ? { backgroundImage: `url("${place.image}")` } : undefined} />
              <PlaceBody>
                <PlaceTitle>{place.title}</PlaceTitle>
                <PlaceMeta>
                  {place.base_position ? (
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
          )
        })}
      </PlacesGrid>
    </>
  )
}

export { PlacesTab }
export type { PlacesTabProps }

// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import type { PlaceDetailSurfaceProps } from './PlaceDetailModal.types'
import {
  PlaceCoverImage,
  PlaceDetailBody,
  PlaceDetailCloseButton,
  PlaceDetailDescription,
  PlaceDetailHeader,
  PlaceDetailIconButton,
  PlaceDetailMetaItem,
  PlaceDetailMetaRow,
  PlaceDetailRoot,
  PlaceDetailTitle,
  PlaceJumpButton,
  PlaceMetaIcon
} from './PlaceDetailModal.styled'

function buildJumpHref(place: ProfilePlace): string | undefined {
  if (place.world && place.world_name) return `/jump/places?realm=${encodeURIComponent(place.world_name.toLowerCase())}`
  const position = place.base_position ?? place.positions?.[0]
  if (!position) return undefined
  return `/jump/places?position=${encodeURIComponent(position)}`
}

function PlaceDetailSurface({ place, onClose, onBack }: PlaceDetailSurfaceProps) {
  const t = useFormatMessage()
  const jumpHref = buildJumpHref(place)
  const locationLabel = place.world && place.world_name ? place.world_name : place.base_position ?? place.positions?.[0]
  return (
    <PlaceDetailRoot>
      <PlaceDetailHeader>
        {onBack ? (
          <PlaceDetailIconButton aria-label={t('profile.header.back')} onClick={onBack}>
            <ArrowBackIosNewIcon fontSize="small" />
          </PlaceDetailIconButton>
        ) : null}
        <PlaceDetailCloseButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
          <CloseIcon />
        </PlaceDetailCloseButton>
      </PlaceDetailHeader>
      <PlaceCoverImage style={place.image ? { backgroundImage: `url("${place.image}")` } : undefined} />
      <PlaceDetailBody>
        <PlaceDetailTitle>{place.title}</PlaceDetailTitle>
        <PlaceDetailMetaRow>
          {locationLabel ? (
            <PlaceDetailMetaItem>
              <PlaceMetaIcon>{place.world ? <LanguageOutlinedIcon /> : <PlaceOutlinedIcon />}</PlaceMetaIcon>
              {locationLabel}
            </PlaceDetailMetaItem>
          ) : null}
          {typeof place.likes === 'number' ? (
            <PlaceDetailMetaItem>
              <PlaceMetaIcon>
                <FavoriteBorderIcon />
              </PlaceMetaIcon>
              {place.likes}
            </PlaceDetailMetaItem>
          ) : null}
          {typeof place.user_count === 'number' && place.user_count > 0 ? (
            <PlaceDetailMetaItem>
              <PlaceMetaIcon>
                <PersonOutlineIcon />
              </PlaceMetaIcon>
              {place.user_count}
            </PlaceDetailMetaItem>
          ) : null}
        </PlaceDetailMetaRow>
        {place.description ? <PlaceDetailDescription>{place.description}</PlaceDetailDescription> : null}
        {jumpHref ? (
          <PlaceJumpButton href={jumpHref} variant="contained" color="primary">
            {t('profile.places.jump_in')}
          </PlaceJumpButton>
        ) : null}
      </PlaceDetailBody>
    </PlaceDetailRoot>
  )
}

export { PlaceDetailSurface }

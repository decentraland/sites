import { memo, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildJumpInHref } from '../../../features/social'
import type { SocialPlace } from '../../../features/social'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import {
  ActionButton,
  Actions,
  Body,
  Card,
  CardLink,
  Cover,
  CoverFallback,
  CoverImage,
  FallbackDisc,
  Meta,
  Title,
  UsersBadge
} from './PlaceCard.styled'

interface PlaceCardProps {
  place: SocialPlace
}

function PlaceCardComponent({ place }: PlaceCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  // Switches to the gradient + first-letter disc fallback when the cover
  // image is missing OR the request 404s / mixed-content fails.
  const [imageBroken, setImageBroken] = useState(false)
  const showFallback = !place.image || imageBroken
  const fallbackInitial = (place.title || place.world_name || '?').charAt(0)

  // Both LIVE and "browse all" cards deep-link to the scene detail page
  // — same destination for everyone. The page itself decides what to
  // present (watcher + chat for live scenes, info-only when nobody's
  // around). Genesis City parcels with no resolvable position fall back
  // to a no-op anchor (rare; happens if the API returns a place with
  // neither base_position nor positions[]).
  const detailHref = useMemo(() => {
    if (place.world && place.world_name) {
      return `/social/world/${encodeURIComponent(place.world_name.toLowerCase())}`
    }
    if (place.base_position) return `/social/place/${place.base_position}`
    if (place.positions?.[0]) return `/social/place/${place.positions[0]}`
    return null
  }, [place])

  const jumpInHref = useMemo(() => buildJumpInHref(place), [place])
  const subtitle = place.world ? place.world_name ?? '' : place.base_position ?? place.positions?.[0] ?? ''

  const openDetail = useCallback(() => {
    if (detailHref) navigate(detailHref)
  }, [detailHref, navigate])

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      openDetail()
    },
    [openDetail]
  )

  return (
    <Card>
      <CardLink href={detailHref ?? '#'} onClick={handleCardClick} aria-label={place.title}>
        <Cover>
          {place.image && !imageBroken && <CoverImage src={place.image} alt="" loading="lazy" onError={() => setImageBroken(true)} />}
          {showFallback && (
            <CoverFallback>
              <FallbackDisc>{fallbackInitial}</FallbackDisc>
            </CoverFallback>
          )}
          {/* No "LIVE" pill on cards. The hot-scenes feed (which powers
              the LIVE NOW section) returns scenes with active users
              in-world, not scenes with an active video broadcast —
              putting a LIVE pill on every card would promise a stream
              that often isn't there. The people-count pill is the
              honest signal. */}
          {typeof place.user_count === 'number' && place.user_count > 0 && (
            <UsersBadge>{t('social.card.users_count', { count: place.user_count })}</UsersBadge>
          )}
        </Cover>
        <Body>
          <Title title={place.title}>{place.title}</Title>
          {subtitle && <Meta title={subtitle}>{subtitle}</Meta>}
        </Body>
      </CardLink>
      <Actions>
        <ActionButton variant="outlined" color="secondary" size="small" onClick={openDetail}>
          {t('social.card.details')}
        </ActionButton>
        <ActionButton
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            window.location.href = jumpInHref
          }}
        >
          {t('social.card.jump_in')}
        </ActionButton>
      </Actions>
    </Card>
  )
}

const PlaceCard = memo(PlaceCardComponent)

export { PlaceCard }

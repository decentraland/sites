import { memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeGroup, EventSmallCard, UserCountBadge, useMediaQuery, useTheme } from 'decentraland-ui2'
import {
  buildDetailPath,
  discoverPlacePayload,
  placeCoordsLabel,
  placeCoverImage,
  placeHasLiveEvent,
  placeHasPeople,
  placeLiveEventName,
  placePlayers
} from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { usePlaceCreator } from '../../../hooks/usePlaceCreator'
import { SegmentEvent } from '../../../modules/segment.types'
import { LiveEventBadge } from '../_shared'
import { JumpInGlyph, PinGlyph } from '../_shared/CardIcons'
import { MEDIA_FALLBACK } from '../_shared/DiscoverShell.styled'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
import { BadgeScale, JumpInCta, LocationPill } from './FeaturedCard.styled'

interface FeaturedCardProps {
  place: DiscoverPlace
  // When set, clicking an EMPTY scene opens the JUMP IN modal in place instead
  // of navigating. Live featured scenes always navigate to the scene preview.
  onEmptyClick?: (place: DiscoverPlace) => void
}

// Compact horizontal Featured card. This is decentraland-ui2's EventSmallCard —
// the same card the events page uses under Upcoming — with the badge strip, the
// location pill and the JUMP IN CTA passed into its slots, so the two sections
// share one hover reveal and one set of dimensions instead of drifting apart.
function FeaturedCardComponent({ place, onEmptyClick }: FeaturedCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const theme = useTheme()
  // The shared card already hides its hover actions on touch widths; this also
  // drops the lift + glow, which would otherwise stick after a tap.
  const isTouchWidth = useMediaQuery(theme.breakpoints.down('md'))

  const detailHref = useMemo(() => buildDetailPath(place), [place])

  const { jumpIn } = useDiscoverJumpIn()
  const { creatorName, creatorAvatar, avatarBg } = usePlaceCreator(place)
  const coords = placeCoordsLabel(place)

  const track = useDeferredTrack()

  const isLive = placeHasPeople(place)
  // A busy featured scene moves to the LIVE section, so the case left here is a scene hosting an
  // event with nobody in it yet — which is why the strip can't be gated on presence alone.
  const hasLiveEvent = placeHasLiveEvent(place)

  const handleClick = useCallback(() => {
    track(SegmentEvent.DISCOVER_CLICK_FEATURED_CARD, discoverPlacePayload(place))
    if (!isLive && onEmptyClick) {
      onEmptyClick(place)
      return
    }
    // Hand the place through router state so the scene page paints its real
    // header / cover immediately instead of blanking to a spinner.
    if (detailHref) navigate(detailHref, { state: { place } })
  }, [track, isLive, onEmptyClick, place, detailHref, navigate])

  const handleJumpIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      jumpIn(place, 'featured-card')
    },
    [jumpIn, place]
  )

  return (
    <EventSmallCard
      image={placeCoverImage(place)}
      imageFallbackColor={MEDIA_FALLBACK}
      thumbnailOverlay={
        isLive || hasLiveEvent ? (
          <BadgeScale>
            <BadgeGroup>
              {hasLiveEvent && <LiveEventBadge eventName={placeLiveEventName(place)} />}
              {isLive && <UserCountBadge count={placePlayers(place)} />}
            </BadgeGroup>
          </BadgeScale>
        ) : undefined
      }
      title={place.title}
      creatorName={creatorName}
      creatorAvatarUrl={creatorAvatar}
      creatorAvatarBackgroundColor={avatarBg}
      byLabel={t('discover.card.by')}
      bottomPill={
        coords ? (
          <LocationPill>
            <PinGlyph size="15px" />
            {coords}
          </LocationPill>
        ) : undefined
      }
      hoverActions={
        <JumpInCta type="button" onClick={handleJumpIn}>
          {t('discover.card.jump_in')}
          <JumpInGlyph size="24.874px" />
        </JumpInCta>
      }
      onClick={handleClick}
      disableHover={isTouchWidth}
    />
  )
}

const FeaturedCard = memo(FeaturedCardComponent)

export { FeaturedCard }

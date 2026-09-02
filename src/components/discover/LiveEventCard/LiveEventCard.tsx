import { memo, useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeGroup, LiveBadge, UserCountBadge, useMediaQuery, useTheme } from 'decentraland-ui2'
import {
  buildDetailPath,
  discoverPlacePayload,
  placeCoverImage,
  placeHasLiveEvent,
  placeIsFeatured,
  placePlayers
} from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { useNewPlacesLayout } from '../../../features/discover/discover.flags'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { usePlaceOwnerAvatar } from '../../../hooks/usePlaceOwnerAvatar'
import { SegmentEvent } from '../../../modules/segment.types'
import { JumpInGlyph, MedalGlyph } from '../_shared/CardIcons'
import { FeaturedBadge, TopRow } from '../_shared/DiscoverShell.styled'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
import {
  Avatar,
  ByRow,
  ByText,
  Card,
  CardContainer,
  ContentBar,
  CreatorName,
  EventTitle,
  JumpInWide,
  Media,
  SwapArea
} from './LiveEventCard.styled'

interface LiveEventCardProps {
  place: DiscoverPlace
}

// Live Now rail card (Figma EventCard/Live, 223:20444). Only ever rendered
// for scenes with players, so clicking always navigates to the live viewer;
// hover fades the By row out and raises a full-width JUMP IN into the native
// client from under the content bar.
function LiveEventCardComponent({ place }: LiveEventCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const theme = useTheme()
  // Mobile has no hover: the card shows the By row AND a persistent JUMP IN
  // button (Figma 2014-20434), rather than the desktop hover-swap.
  const isMobileCard = useMediaQuery(theme.breakpoints.down('sm'))
  const [hovered, setHovered] = useState(false)
  // Clicking the CTA focuses it, and the launcher's modal then steals the
  // pointer — so hover alone would park a focused button outside the card's
  // clip, aria-hidden and still activatable by Enter.
  const [ctaFocused, setCtaFocused] = useState(false)

  const detailHref = useMemo(() => buildDetailPath(place), [place])

  const { jumpIn } = useDiscoverJumpIn()
  const { ownerName, ownerAvatar, avatarBg } = usePlaceOwnerAvatar(place)

  const players = placePlayers(place)
  const newLayout = useNewPlacesLayout()
  // A scene that qualifies for LIVE renders only here, so its Featured identity has to travel with
  // it — otherwise being busy would look like losing the badge.
  const isFeatured = placeIsFeatured(place)
  const track = useDeferredTrack()

  const handleClick = useCallback(() => {
    track(SegmentEvent.DISCOVER_CLICK_LIVE_CARD, discoverPlacePayload(place))
    // Hand the place through router state so the scene page paints its real
    // header / cover immediately instead of blanking to a spinner.
    if (detailHref) navigate(detailHref, { state: { place } })
  }, [track, detailHref, navigate, place])

  // Keyboard activation for the role="button" card (Enter / Space).
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  const handleJumpIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      jumpIn(place, 'live-card')
    },
    [jumpIn, place]
  )

  // Mobile keeps both rows; desktop trades one for the other on hover.
  const ctaVisible = isMobileCard || hovered || ctaFocused
  const byRowHidden = !isMobileCard && (hovered || ctaFocused)

  return (
    <CardContainer>
      <Card
        role="button"
        tabIndex={0}
        $hovered={hovered}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Media $image={placeCoverImage(place)}>
          <TopRow>
            {/* ui2's badges — same animated LIVE pill What's On uses. */}
            <BadgeGroup>
              {/* LIVE means an event is running, not that people are here — presence is the count
                  next to it. On the legacy path the badge still tracks presence. */}
              {(newLayout ? placeHasLiveEvent(place) : true) && <LiveBadge />}
              <UserCountBadge count={players} />
            </BadgeGroup>
            {newLayout && isFeatured && (
              <FeaturedBadge>
                <MedalGlyph size="min(3.455cqw, 14px)" />
                {t('discover.card.featured')}
              </FeaturedBadge>
            )}
          </TopRow>
        </Media>
        <ContentBar>
          <EventTitle>{place.title}</EventTitle>
          {/* Both stay mounted so the CTA can animate in; whichever is off-state
              leaves the a11y tree instead of the DOM. Mobile shows both. */}
          <SwapArea>
            <ByRow $hidden={byRowHidden} aria-hidden={byRowHidden || undefined}>
              {ownerName && (
                <>
                  {ownerAvatar && <Avatar src={ownerAvatar} alt="" loading="lazy" $bg={avatarBg} />}
                  <ByText>
                    {t('discover.card.by')} <CreatorName>{ownerName}</CreatorName>
                  </ByText>
                </>
              )}
            </ByRow>
            <JumpInWide
              type="button"
              $visible={ctaVisible}
              aria-hidden={!ctaVisible || undefined}
              tabIndex={ctaVisible ? 0 : -1}
              onFocus={() => setCtaFocused(true)}
              onBlur={() => setCtaFocused(false)}
              onClick={handleJumpIn}
            >
              {t('discover.card.jump_in')}
              <JumpInGlyph size="min(6.138cqw, 24.874px)" />
            </JumpInWide>
          </SwapArea>
        </ContentBar>
      </Card>
    </CardContainer>
  )
}

const LiveEventCard = memo(LiveEventCardComponent)

export { LiveEventCard }

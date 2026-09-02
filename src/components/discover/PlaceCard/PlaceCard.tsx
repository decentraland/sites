import { memo, useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeGroup, LiveBadge, UserCountBadge } from 'decentraland-ui2'
import {
  buildDetailPath,
  discoverPlacePayload,
  placeCoordsLabel,
  placeCoverImage,
  placeHasLiveEvent,
  placeHasPeople,
  placeIsFeatured,
  placeIsLive,
  placePlayers
} from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { useNewPlacesLayout } from '../../../features/discover/discover.flags'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { usePlaceCreator } from '../../../hooks/usePlaceCreator'
import { SegmentEvent } from '../../../modules/segment.types'
import { JumpInGlyph, MedalGlyph, PinGlyph } from '../_shared/CardIcons'
import { FeaturedBadge, TopRow } from '../_shared/DiscoverShell.styled'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
import {
  Avatar,
  Body,
  ByText,
  Card,
  CardContainer,
  Cover,
  CreatorName,
  CreatorRow,
  JumpInButton,
  LocationPill,
  Media,
  MetaRow,
  SwapArea,
  Title
} from './PlaceCard.styled'

// Show the online pill (green dot + live player count) next to the LIVE badge,
// matching the Figma. Kept as a flag so it can be toggled in one line.
interface PlaceCardProps {
  place: DiscoverPlace
  // When set, clicking a card with nobody in the scene calls this (the page
  // opens the JUMP IN modal in place) instead of navigating to the detail
  // route. Live cards always navigate to the bevy viewer.
  onEmptyClick?: (place: DiscoverPlace) => void
}

function PlaceCardComponent({ place, onEmptyClick }: PlaceCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  // The CTA never unmounts, so hover alone would leave a focused button
  // invisible and aria-hidden after the launcher modal takes the pointer.
  const [ctaFocused, setCtaFocused] = useState(false)

  const detailHref = useMemo(() => buildDetailPath(place), [place])

  const { jumpIn } = useDiscoverJumpIn()
  const { creatorName, creatorAvatar, avatarBg } = usePlaceCreator(place)

  const players = placePlayers(place)
  const newLayout = useNewPlacesLayout()
  // Presence, which decides where a click goes: a scene with people opens the viewer, an empty one
  // opens the JUMP IN modal. Deliberately NOT the same question as the LIVE badge.
  const isLive = placeHasPeople(place)
  const isFeatured = placeIsFeatured(place)
  const coords = placeCoordsLabel(place)
  // Hover reveals the CTA; focus keeps it revealed so it is never both focused
  // and hidden.
  const ctaShown = hovered || ctaFocused

  const track = useDeferredTrack()

  const handleClick = useCallback(() => {
    track(SegmentEvent.DISCOVER_CLICK_PLACE_CARD, discoverPlacePayload(place))
    if (!isLive && onEmptyClick) {
      onEmptyClick(place)
      return
    }
    // Hand the place through router state so the scene page paints its real
    // header / cover immediately instead of blanking to a spinner.
    if (detailHref) navigate(detailHref, { state: { place } })
  }, [track, isLive, onEmptyClick, place, detailHref, navigate])

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
      // Stop propagation so the card's onClick doesn't also navigate while the
      // launcher is opening.
      e.stopPropagation()
      jumpIn(place, 'place-card')
    },
    [jumpIn, place]
  )

  return (
    <CardContainer>
      <Card
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Media>
          <Cover $image={placeCoverImage(place)} />
          <TopRow>
            {/* ui2's badges — same animated LIVE pill What's On uses. */}
            <BadgeGroup>
              {(newLayout ? placeHasLiveEvent(place) : placeIsLive(place)) && <LiveBadge />}
              {players > 0 && <UserCountBadge count={players} />}
            </BadgeGroup>
            {isFeatured && (
              <FeaturedBadge>
                <MedalGlyph size="min(3.217cqw, 14px)" />
                {t('discover.card.featured')}
              </FeaturedBadge>
            )}
          </TopRow>
        </Media>
        <Body>
          <Title>{place.title}</Title>
          <SwapArea>
            <MetaRow $hidden={ctaShown} aria-hidden={ctaShown || undefined}>
              <CreatorRow>
                {creatorAvatar && <Avatar src={creatorAvatar} alt="" loading="lazy" $bg={avatarBg} />}
                {creatorName && (
                  <ByText variant="body2">
                    {t('discover.card.by')} <CreatorName>{creatorName}</CreatorName>
                  </ByText>
                )}
              </CreatorRow>
              {coords && (
                <LocationPill>
                  <PinGlyph size="min(3.446cqw, 15px)" />
                  {coords}
                </LocationPill>
              )}
            </MetaRow>
            <JumpInButton
              type="button"
              $visible={ctaShown}
              aria-hidden={!ctaShown || undefined}
              tabIndex={ctaShown ? 0 : -1}
              onFocus={() => setCtaFocused(true)}
              onBlur={() => setCtaFocused(false)}
              onClick={handleJumpIn}
            >
              {t('discover.card.jump_in')}
              <JumpInGlyph size="min(5.715cqw, 24.874px)" />
            </JumpInButton>
          </SwapArea>
        </Body>
      </Card>
    </CardContainer>
  )
}

const PlaceCard = memo(PlaceCardComponent)

export { PlaceCard }

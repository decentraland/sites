import { memo, useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LiveBadge, UserCountBadge } from 'decentraland-ui2'
import { buildDetailPath, discoverPlacePayload, placeCoordsLabel, placeCoverImage, placePlayers } from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { useNewPlacesLayout } from '../../../features/discover/discover.flags'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { usePlaceOwnerAvatar } from '../../../hooks/usePlaceOwnerAvatar'
import { SegmentEvent } from '../../../modules/segment.types'
import { JumpInGlyph, PinGlyph } from '../_shared/CardIcons'
import { useDiscoverJumpIn } from '../DiscoverJumpInProvider'
import {
  BottomSwap,
  ByText,
  Card,
  CardContainer,
  Content,
  CreatorAvatar,
  CreatorName,
  CreatorRow,
  JumpInButton,
  LocationRow,
  Name,
  Thumb,
  ThumbBadges,
  Title
} from './FeaturedCard.styled'

interface FeaturedCardProps {
  place: DiscoverPlace
  // When set, clicking an EMPTY scene opens the JUMP IN modal in place instead
  // of navigating. Live featured scenes always navigate to the scene preview.
  onEmptyClick?: (place: DiscoverPlace) => void
}

function FeaturedCardComponent({ place, onEmptyClick }: FeaturedCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const detailHref = useMemo(() => buildDetailPath(place), [place])

  const { jumpIn } = useDiscoverJumpIn()
  const { ownerName, ownerAvatar, avatarBg } = usePlaceOwnerAvatar(place)
  const coords = placeCoordsLabel(place)

  const track = useDeferredTrack()

  const newLayout = useNewPlacesLayout()
  const isLive = placePlayers(place) > 0

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
      jumpIn(place, 'featured-card')
    },
    [jumpIn, place]
  )

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
        <Thumb $image={placeCoverImage(place)}>
          {/* No tags on this card (LIVE / Featured stay on the Live rail and
              Explore grid — interim until the card redesign), but any presence
              shows its count (same `> 0` rule as PlaceCard) so the card agrees
              with the scene page, which opens the live preview at any
              presence. */}
          {/* A busy featured scene moves to the LIVE section, so the case left here is a scene
              hosting an event with nobody in it yet — which is why the strip can no longer be gated
              on presence alone. */}
          {(placePlayers(place) > 0 || (newLayout && place.live === true)) && (
            <ThumbBadges>
              {newLayout && place.live === true && <LiveBadge />}
              {placePlayers(place) > 0 && <UserCountBadge count={placePlayers(place)} />}
            </ThumbBadges>
          )}
        </Thumb>
        <Content>
          <Name>
            <Title>{place.title}</Title>
            {ownerName && (
              <CreatorRow $hidden={hovered}>
                {ownerAvatar && <CreatorAvatar src={ownerAvatar} alt="" loading="lazy" $bg={avatarBg} />}
                <ByText variant="caption">
                  {t('discover.card.by')} <CreatorName>{ownerName}</CreatorName>
                </ByText>
              </CreatorRow>
            )}
          </Name>
          <BottomSwap>
            {coords && (
              <LocationRow $hidden={hovered}>
                <PinGlyph size="min(3.494cqw, 15px)" />
                {coords}
              </LocationRow>
            )}
            <JumpInButton type="button" $visible={hovered} onClick={handleJumpIn}>
              {t('discover.card.jump_in')}
              <JumpInGlyph size="min(5.795cqw, 24.874px)" />
            </JumpInButton>
          </BottomSwap>
        </Content>
      </Card>
    </CardContainer>
  )
}

const FeaturedCard = memo(FeaturedCardComponent)

export { FeaturedCard }

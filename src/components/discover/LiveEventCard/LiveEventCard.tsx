import { memo, useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeGroup, LiveBadge, UserCountBadge, useMediaQuery, useTheme } from 'decentraland-ui2'
import { buildDetailPath, buildJumpInHref, discoverPlacePayload, placeCoverImage, placePlayers } from '../../../features/discover'
import type { DiscoverPlace } from '../../../features/discover'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { usePlaceOwnerAvatar } from '../../../hooks/usePlaceOwnerAvatar'
import { SegmentEvent } from '../../../modules/segment.types'
import { JumpInGlyph } from '../_shared/CardIcons'
import { TopRow } from '../_shared/DiscoverShell.styled'
import { Avatar, ByRow, ByText, Card, CardContainer, ContentBar, CreatorName, EventTitle, JumpInWide, Media } from './LiveEventCard.styled'

interface LiveEventCardProps {
  place: DiscoverPlace
}

// Live Now rail card (Figma EventCard/Live, 223:20444). Only ever rendered
// for scenes with players, so clicking always navigates to the live viewer;
// hover swaps the By row for a full-width JUMP IN into the native client.
function LiveEventCardComponent({ place }: LiveEventCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()
  const theme = useTheme()
  // Mobile has no hover: the card shows the By row AND a persistent JUMP IN
  // button (Figma 2014-20434), rather than the desktop hover-swap.
  const isMobileCard = useMediaQuery(theme.breakpoints.down('sm'))
  const [hovered, setHovered] = useState(false)

  const detailHref = useMemo(() => buildDetailPath(place), [place])

  const jumpInHref = useMemo(() => buildJumpInHref(place), [place])

  const { ownerName, ownerAvatar, avatarBg } = usePlaceOwnerAvatar(place)

  const players = placePlayers(place)
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
      track(SegmentEvent.DISCOVER_JUMP_IN, { ...discoverPlacePayload(place), place: 'live-card' })
      window.location.href = jumpInHref
    },
    [track, jumpInHref, place]
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
        <Media $image={placeCoverImage(place)}>
          <TopRow>
            {/* ui2's badges — same animated LIVE pill What's On uses. */}
            <BadgeGroup>
              <LiveBadge />
              <UserCountBadge count={players} />
            </BadgeGroup>
          </TopRow>
        </Media>
        <ContentBar>
          <EventTitle>{place.title}</EventTitle>
          {/* Desktop swaps By ↔ JUMP IN on hover; mobile shows both stacked. */}
          {(isMobileCard || !hovered) && (
            <ByRow>
              {ownerName && (
                <>
                  {ownerAvatar && <Avatar src={ownerAvatar} alt="" loading="lazy" $bg={avatarBg} />}
                  <ByText>
                    {t('discover.card.by')} <CreatorName>{ownerName}</CreatorName>
                  </ByText>
                </>
              )}
            </ByRow>
          )}
          {(isMobileCard || hovered) && (
            <JumpInWide type="button" onClick={handleJumpIn}>
              {t('discover.card.jump_in')}
              <JumpInGlyph size="min(6.138cqw, 24.874px)" />
            </JumpInWide>
          )}
        </ContentBar>
      </Card>
    </CardContainer>
  )
}

const LiveEventCard = memo(LiveEventCardComponent)

export { LiveEventCard }

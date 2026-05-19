import { memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention -- React component default export, matches MUI icon convention
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { EventSmallCard, UserCountBadge } from 'decentraland-ui2'
import { buildJumpInHref } from '../../../features/discover'
import type { SocialPlace } from '../../../features/discover'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { getAvatarBackgroundColor } from '../../../utils/avatarColor'
import { ActionTextButton, ActionTextLabel } from '../../whats-on/common/CardActions.styled'
import { PlaceCardBadge, PlaceCardWrapper } from './PlaceCard.styled'

// Generate a small data-URL SVG with the owner's initial on a color
// deterministically derived from their name. Mirrors the FNV-1a/HSV
// palette the rest of the app uses (ADR-292 NameColorHelper) so the same
// owner always lands on the same colored disc — and the disc reads as
// "an avatar that just hasn't been uploaded yet" rather than the green
// generic placeholder. Used only when the catalyst returns no face256.
function getSyntheticAvatarUrl(name: string): string {
  const bg = getAvatarBackgroundColor(name)
  const initial = (name.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${bg}"/><text x="16" y="22" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="white">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface PlaceCardProps {
  place: SocialPlace
}

function PlaceCardComponent({ place }: PlaceCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()

  const detailHref = useMemo(() => {
    if (place.world && place.world_name) {
      return `/discover/world/${encodeURIComponent(place.world_name.toLowerCase())}`
    }
    if (place.base_position) return `/discover/place/${place.base_position}`
    if (place.positions?.[0]) return `/discover/place/${place.positions[0]}`
    return null
  }, [place])

  const jumpInHref = useMemo(() => buildJumpInHref(place), [place])
  // Resolve the owner's catalyst profile (module-level cache dedupes per
  // address across the whole grid — no N+1). Use the real face256 when
  // it exists, otherwise synthesize a colored-disc-with-initial avatar
  // from the name so every card with an owner gets a real-looking avatar
  // instead of the green generic fallback.
  const { data: ownerProfile } = useGetProfileQuery(place.owner ?? undefined, { skip: !place.owner })
  const realAvatar = ownerProfile?.avatars?.[0]?.avatar?.snapshots?.face256
  const ownerName = place.user_name || place.contact_name
  const ownerAvatar = realAvatar || (ownerName ? getSyntheticAvatarUrl(ownerName) : undefined)
  const creatorName = ownerAvatar && ownerName ? ownerName : undefined
  const userCount = typeof place.user_count === 'number' && place.user_count > 0 ? place.user_count : 0

  const handleClick = useCallback(() => {
    if (detailHref) navigate(detailHref)
  }, [detailHref, navigate])

  const handleJumpIn = useCallback(
    (e: React.MouseEvent) => {
      // Stop propagation so the parent card's onClick doesn't also fire and
      // try to navigate to /discover/place/... while the launcher is opening.
      e.stopPropagation()
      window.location.href = jumpInHref
    },
    [jumpInHref]
  )

  return (
    <PlaceCardWrapper>
      {userCount > 0 && (
        // Reusing the same `UserCountBadge` component /whats-on uses
        // (decentraland-ui2 Badges) so the visual treatment stays
        // consistent across surfaces. Bottom-left of the cover image,
        // matching where the original `UsersBadge` lived. BROWSE cards
        // never reach this branch — the page strips `user_count` to 0
        // before they get here, so only LIVE NOW shows the pill.
        <PlaceCardBadge>
          <UserCountBadge count={userCount} />
        </PlaceCardBadge>
      )}
      <EventSmallCard
        image={place.image || undefined}
        title={place.title}
        creatorName={creatorName}
        creatorAvatarUrl={creatorName ? ownerAvatar : undefined}
        onClick={handleClick}
        hoverActions={
          <ActionTextButton onClick={handleJumpIn}>
            <RocketLaunchIcon style={{ fontSize: 16 }} />
            <ActionTextLabel>{t('social.card.jump_in')}</ActionTextLabel>
          </ActionTextButton>
        }
      />
    </PlaceCardWrapper>
  )
}

const PlaceCard = memo(PlaceCardComponent)

export { PlaceCard }

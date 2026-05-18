import { memo, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention -- React component default export, matches MUI icon convention
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { EventSmallCard } from 'decentraland-ui2'
import { buildJumpInHref } from '../../../features/social'
import type { SocialPlace } from '../../../features/social'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ActionTextButton, ActionTextLabel } from '../../whats-on/common/CardActions.styled'

interface PlaceCardProps {
  place: SocialPlace
}

// PlaceCard wraps the shared `EventSmallCard` primitive (same component
// /whats-on uses for upcoming events) so the LIVE / EXPLORE grids inherit
// the whats-on hover lift, glow, typography and author row. The clock
// icon in EventSmallCard's TimePill doubles as the "active now" indicator
// when we put the people-in-world count there — close enough semantically,
// keeps a single shared card shape across both surfaces.
function PlaceCardComponent({ place }: PlaceCardProps) {
  const t = useFormatMessage()
  const navigate = useNavigate()

  const detailHref = useMemo(() => {
    if (place.world && place.world_name) {
      return `/social/world/${encodeURIComponent(place.world_name.toLowerCase())}`
    }
    if (place.base_position) return `/social/place/${place.base_position}`
    if (place.positions?.[0]) return `/social/place/${place.positions[0]}`
    return null
  }, [place])

  const jumpInHref = useMemo(() => buildJumpInHref(place), [place])
  const creatorName = place.user_name || place.contact_name || undefined
  const peopleLabel = useMemo(() => {
    if (typeof place.user_count !== 'number' || place.user_count <= 0) return undefined
    return t('social.card.users_count', { count: place.user_count })
  }, [place.user_count, t])

  const handleClick = useCallback(() => {
    if (detailHref) navigate(detailHref)
  }, [detailHref, navigate])

  const handleJumpIn = useCallback(
    (e: React.MouseEvent) => {
      // Stop propagation so the parent card's onClick doesn't also fire and
      // try to navigate to /social/place/... while the launcher is opening.
      e.stopPropagation()
      window.location.href = jumpInHref
    },
    [jumpInHref]
  )

  return (
    <EventSmallCard
      image={place.image || undefined}
      title={place.title}
      creatorName={creatorName}
      timeLabel={peopleLabel}
      onClick={handleClick}
      hoverActions={
        <ActionTextButton onClick={handleJumpIn}>
          <RocketLaunchIcon style={{ fontSize: 16 }} />
          <ActionTextLabel>{t('social.card.jump_in')}</ActionTextLabel>
        </ActionTextButton>
      }
    />
  )
}

const PlaceCard = memo(PlaceCardComponent)

export { PlaceCard }

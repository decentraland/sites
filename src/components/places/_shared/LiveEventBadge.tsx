import { LiveBadge, Tooltip } from 'decentraland-ui2'
import { BadgeTrigger } from './LiveEventBadge.styled'

interface LiveEventBadgeProps {
  // Title of the event running at the place, when places-api sends one.
  eventName?: string
}

// The red LIVE pill, with the event's title on hover when we know it. The
// badge itself means "an event is running here" and says nothing about which,
// so the tooltip is what turns it into information; without a title it stays
// exactly the badge the three cards rendered before.
function LiveEventBadge({ eventName }: LiveEventBadgeProps) {
  if (!eventName) return <LiveBadge />

  return (
    <Tooltip title={eventName} arrow placement="top">
      {/* MUI hands the trigger a ref and the hover listeners, so it needs a
          real DOM node: ui2's LiveBadge is not guaranteed to forward one. */}
      <BadgeTrigger>
        <LiveBadge />
      </BadgeTrigger>
    </Tooltip>
  )
}

export { LiveEventBadge }

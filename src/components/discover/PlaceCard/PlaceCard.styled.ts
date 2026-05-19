import { Box, styled } from 'decentraland-ui2'

// Relative wrapper around EventSmallCard so we can overlay a floating
// people-count badge on the cover image without modifying the upstream
// component. Used for the LIVE NOW feed only — BROWSE cards don't get
// the pill (places-api's `user_count` is a stale snapshot, not real
// presence).
const PlaceCardWrapper = styled(Box)({
  position: 'relative',
  width: '100%'
})

// Bottom-left overlay on the cover image, anchoring the people-count
// pill where the original `UsersBadge` lived. `pointer-events: none`
// keeps clicks falling through to the card body so navigate / JUMP IN
// still work even when the cursor lands on the badge area.
const PlaceCardBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1),
  left: theme.spacing(1),
  zIndex: 2,
  pointerEvents: 'none'
}))

export { PlaceCardBadge, PlaceCardWrapper }

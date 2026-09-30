import { Box, styled } from 'decentraland-ui2'

// Carries the ref and the pointer listeners for the tooltip without changing
// how the badge sits in the card's badge row.
//
// The row itself is `pointer-events: none` so a click anywhere over the cover
// reaches the card, which also means the badge can never be hovered. Only this
// one element opts back in: a click on it still bubbles to the card's handler,
// so nothing about clicking changes, but the pointer can now land on the badge
// long enough for the tooltip to open.
const BadgeTrigger = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  pointerEvents: 'auto'
})

export { BadgeTrigger }

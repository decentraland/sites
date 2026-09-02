import { Box, styled } from 'decentraland-ui2'

// Carries the ref and the pointer listeners for the tooltip without changing
// how the badge sits in the card's badge row.
const BadgeTrigger = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center'
})

export { BadgeTrigger }

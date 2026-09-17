import { Box, dclColors, styled } from 'decentraland-ui2'

// Chrome for the three slots handed to decentraland-ui2's EventSmallCard. The
// frame, thumbnail, title, creator row, hover lift and hover reveal all belong
// to the shared card, so only the Places-specific bits live here.
const SNOW = dclColors.neutral.softWhite // #fcfcfc
const GRAY5 = dclColors.neutral.gray5 // #ecebed
const RUBY = dclColors.base.primary // #ff2d55
const LOC_BG = 'rgba(255, 255, 255, 0.05)'

// ui2's UserCountBadge is a fixed 26px sized for the big grid cards; scale the
// strip down to fit this compact 140px card rather than restyling its internals.
const BadgeScale = styled(Box)({
  transform: 'scale(0.8)',
  transformOrigin: 'top left'
})

// Bottom-slot pill: pin + coordinates, where an event card shows its start time.
const LocationPill = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3.875,
  padding: '2px 8px 2px 4px',
  borderRadius: 5.813,
  backgroundColor: LOC_BG,
  fontSize: 14, // typography/body2
  fontWeight: 400,
  lineHeight: 1.43,
  color: GRAY5,
  // The shared card drops its min width below md, so a long world_name would
  // be clipped mid-glyph by the card's overflow.
  minWidth: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

// Hover CTA — fills the card's hover-actions row.
const JumpInCta = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8.496,
  width: '100%',
  height: 33,
  border: 'none',
  borderRadius: 8,
  backgroundColor: RUBY,
  color: SNOW,
  fontFamily: theme.typography.fontFamily, // buttons don't inherit it
  fontSize: 13, // button/small
  fontWeight: 600,
  letterSpacing: 0.46,
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest }),
  ['&:hover']: { backgroundColor: theme.palette.primary.dark },
  ['&:active']: { backgroundColor: theme.palette.primary.dark },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

export { BadgeScale, JumpInCta, LocationPill }

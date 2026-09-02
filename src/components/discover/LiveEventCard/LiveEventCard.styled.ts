import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { HOVER_GLOW, MEDIA_FALLBACK } from '../_shared/DiscoverShell.styled'

// Live Now rail card — pixel-matched to the Figma EventCard Live variant
// (223:20444, 405.25×329): cover image fills the card with the LIVE + online
// pills floating inside, and a rgba(0,0,0,0.6) content bar at the bottom
// (title + By row; on hover the By row fades out while a full-width JUMP IN
// rises from under the bar's bottom edge, and the card gains the white glow).
// All dimensions are cqw against the Figma card width so the card scales down
// proportionally in its grid column, with every value CAPPED at its design px
// (min(cqw, px)) so a grown card — the rail stretches cards when fewer than 4
// scenes are live — keeps What's-On-sized chrome instead of ballooning.
// 1cqw = 4.0525px at the Figma's 405.25px width.
const SNOW = dclColors.neutral.softWhite // #fcfcfc
const RUBY = dclColors.base.primary // #ff2d55
const CTA_HEIGHT = 'min(11.764cqw, 47.674px)'
const ROW_GAP = 'min(1.974cqw, 8px)'
// Matches the content bar's bottom padding — the CTA's parked offset has to
// clear it to sit past the card edge.
const BAR_BOTTOM_PADDING = 'min(3.948cqw, 16px)'

const CardContainer = styled(Box)({
  containerType: 'inline-size',
  width: '100%'
})

const Card = styled(Box, { shouldForwardProp: prop => prop !== '$hovered' })<{ $hovered?: boolean }>(({ theme, $hovered }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: 'min(3.948cqw, 16px)',
  overflow: 'hidden',
  cursor: 'pointer',
  boxShadow: $hovered ? HOVER_GLOW : '0px 2px 2px rgba(0, 0, 0, 0.04)',
  transition: theme.transitions.create('box-shadow', { duration: theme.transitions.duration.short }),
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 },
  // Mobile carousel card (Figma 2014-20434): taller, content-driven so the
  // image + title + By + always-visible JUMP IN all fit.
  [theme.breakpoints.down('sm')]: { aspectRatio: 'auto', borderRadius: 16 }
}))

// Cover image area — fills everything above the content bar; pills sit inside
// with the Figma's 13px inset.
const Media = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<{ $image?: string }>(({ theme, $image }) => ({
  position: 'relative',
  padding: 'min(3.208cqw, 13px)',
  backgroundColor: MEDIA_FALLBACK,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  ...($image && { backgroundImage: `url("${safeCssUrl($image)}")` }),
  // Card height is content-driven at every size: the media brings the design's
  // aspect, capped in height so a grown card widens its crop (like What's On)
  // instead of towering.
  flex: 'none',
  aspectRatio: '405.25 / 253',
  maxHeight: 280, // What's On's media height at the grown width
  [theme.breakpoints.down('sm')]: { aspectRatio: '16 / 10', maxHeight: 'none' }
}))

// Bottom bar over the cover — rgba(0,0,0,0.6), pt-12 pr-12 pb-16 pl-16.
const ContentBar = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: ROW_GAP,
  padding: `min(2.961cqw, 12px) min(2.961cqw, 12px) ${BAR_BOTTOM_PADDING} min(3.948cqw, 16px)`,
  backgroundColor: 'rgba(0, 0, 0, 0.6)'
})

// typography/h6 — 20px Inter Medium, 1.6 line.
const EventTitle = styled(Typography)({
  fontSize: 'min(4.935cqw, 20px)',
  fontWeight: 500,
  lineHeight: 1.6,
  color: SNOW,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

// Bottom slot of the content bar. The By row and the CTA are stacked inside it
// so the CTA can travel without changing the card's height (the rail would
// reflow). Mobile has no hover and shows both, so the slot becomes a column.
const SwapArea = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: CTA_HEIGHT,
  [theme.breakpoints.down('sm')]: {
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: ROW_GAP
  }
}))

const ByRow = styled(Box, { shouldForwardProp: prop => prop !== '$hidden' })<{ $hidden?: boolean }>(({ theme, $hidden }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 'min(2.468cqw, 10px)',
  minWidth: 0,
  transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.complex }),
  ...($hidden && { opacity: 0, pointerEvents: 'none' }),
  [theme.breakpoints.down('sm')]: { position: 'static', opacity: 1 }
}))

// ADR-292 deterministic color behind the (possibly transparent) face256.
const Avatar = styled('img', { shouldForwardProp: prop => prop !== '$bg' })<{ $bg?: string }>(({ $bg }) => ({
  width: 'min(5.675cqw, 23px)',
  height: 'min(5.675cqw, 23px)',
  borderRadius: '50%',
  objectFit: 'cover',
  flexShrink: 0,
  border: 'min(0.405cqw, 1.643px) solid rgba(255, 255, 255, 0.5)',
  backgroundColor: $bg
}))

// typography/subtitle2 — 14px SemiBold, 1.57 line. "By" snow, name ruby.
const ByText = styled(Typography)({
  fontSize: 'min(3.455cqw, 14px)',
  fontWeight: 600,
  lineHeight: 1.57,
  color: SNOW,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const CreatorName = styled('span')({
  color: RUBY
})

// Hover CTA — full-width ruby JUMP IN, 47.674px tall, r12, 16.58px Bold. It
// parks one bar-padding below the slot, which puts it past the card's bottom
// edge (the Card clips it) so it slides into view instead of fading in place —
// the same reveal as the What's On Live Now card.
const JumpInWide = styled('button', { shouldForwardProp: prop => prop !== '$visible' })<{ $visible?: boolean }>(({ theme, $visible }) => ({
  position: 'absolute',
  inset: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'min(2.097cqw, 8.496px)',
  width: '100%',
  padding: '0 min(5.241cqw, 21.241px)',
  border: 'none',
  borderRadius: 'min(2.961cqw, 12px)',
  backgroundColor: RUBY,
  color: SNOW,
  fontSize: 'min(4.091cqw, 16.58px)',
  fontWeight: 700,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  opacity: 0,
  transform: `translateY(calc(100% + ${BAR_BOTTOM_PADDING}))`,
  pointerEvents: 'none',
  transition: [
    theme.transitions.create(['opacity', 'transform'], { duration: theme.transitions.duration.complex }),
    // Press feedback keeps its own shorter duration; folding it into the reveal
    // would slow the ruby hover/active darkening to 375ms.
    theme.transitions.create('background-color', { duration: theme.transitions.duration.shortest })
  ].join(', '),
  ...($visible && { opacity: 1, transform: 'translateY(0)', pointerEvents: 'auto' }),
  // The travel is decoration: cross-fade instead for anyone who asked for less motion.
  ['@media (prefers-reduced-motion: reduce)']: {
    transform: 'none',
    transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.shortest })
  },
  ['&:hover']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:active']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 },
  // No hover on mobile: the CTA is a permanent row under the By row.
  [theme.breakpoints.down('sm')]: {
    position: 'static',
    height: CTA_HEIGHT,
    opacity: 1,
    transform: 'none',
    pointerEvents: 'auto'
  }
}))

export { Avatar, ByRow, ByText, Card, CardContainer, ContentBar, CreatorName, EventTitle, JumpInWide, Media, SwapArea }

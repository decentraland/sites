import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { HOVER_GLOW, MEDIA_FALLBACK } from '../_shared/DiscoverShell.styled'

// Compact horizontal Featured card — pixel-matched to the Figma
// FeaturedPlaceCard (429.25×140): 4px frame, thumbnail left (180px ≈ 42%),
// dark content panel right with title + creator pinned top and location pinned
// bottom. On hover the creator + location swap for a JUMP IN button and the
// whole card gets a white-glow lift.
//
// All internal dimensions are `cqw` relative to the Figma card width of
// 429.25px (`Npx` → `N / 429.25 * 100` cqw), so the card is a proportional
// replica of the design at any grid column width.
const SNOW = dclColors.neutral.softWhite // #fcfcfc
const GRAY5 = dclColors.neutral.gray5 // #ecebed
const RUBY = dclColors.base.primary // #ff2d55
const CONTENT_BG = 'rgba(0, 0, 0, 0.4)'
const LOC_BG = 'rgba(255, 255, 255, 0.05)'

// The query container — everything inside resolves cqw against its width.
const CardContainer = styled(Box)({
  containerType: 'inline-size',
  width: '100%'
})

const Card = styled(Box, { shouldForwardProp: prop => prop !== '$hovered' })<{ $hovered?: boolean }>(({ theme, $hovered }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'stretch',
  height: '32.615cqw', // 140px
  padding: '0.932cqw', // 4px
  borderRadius: '3.727cqw', // 16px
  overflow: 'hidden',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  transition: theme.transitions.create(['box-shadow', 'background-color'], { duration: theme.transitions.duration.short }),
  ...($hovered && { backgroundColor: 'rgba(255, 255, 255, 0.02)', boxShadow: HOVER_GLOW }),
  ['&:focus-visible']: { outline: `2px solid ${RUBY}`, outlineOffset: 2 },
  // Keep the outer clip clear of the inner Thumb/Content 16px corners on mobile.
  [theme.breakpoints.down('sm')]: { borderRadius: 20 }
}))

// Runtime image via background-image so a missing/404 cover degrades to the
// solid fallback (no broken-image icon).
const Thumb = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<{ $image?: string }>(({ theme, $image }) => ({
  position: 'relative',
  width: '41.933cqw', // 180px
  flexShrink: 0,
  borderRadius: '3.599cqw 0 0 3.599cqw', // 15.448px
  backgroundColor: MEDIA_FALLBACK,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  ...($image && { backgroundImage: `url("${safeCssUrl($image)}")` }),
  [theme.breakpoints.down('sm')]: { borderRadius: '16px 0 0 16px' } // pin the Figma radius on mobile
}))

// Presence-count overlay on the thumbnail's top-left corner. Count only —
// this card carries no LIVE / Featured tags. The ui2 UserCountBadge ships a
// fixed 26px height sized for the big grid cards; scale it down to fit this
// compact 140px card rather than restyling its internals.
const ThumbBadges = styled(Box)({
  position: 'absolute',
  top: '1.864cqw', // 8px
  left: '1.864cqw',
  display: 'flex',
  alignItems: 'center',
  gap: '0.932cqw', // 4px
  transform: 'scale(0.8)',
  transformOrigin: 'top left'
})

const Content = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  flex: 1,
  minWidth: 0,
  padding: '2.796cqw 2.796cqw 2.796cqw 3.727cqw', // 12px / 16px left
  borderRadius: '0 3.599cqw 3.599cqw 0',
  backgroundColor: CONTENT_BG,
  [theme.breakpoints.down('sm')]: { borderRadius: '0 16px 16px 0' } // pin the Figma radius on mobile
}))

const Name = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.864cqw', // 8px
  minWidth: 0
})

const Title = styled(Typography)({
  display: '-webkit-box',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitLineClamp: 2,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  fontSize: '3.727cqw', // 16px — Inter Semi-Bold
  fontWeight: 600,
  lineHeight: 1.5,
  color: SNOW
})

const CreatorRow = styled(Box, { shouldForwardProp: prop => prop !== '$hidden' })<{ $hidden?: boolean }>(({ theme, $hidden }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1.864cqw', // 8px
  minWidth: 0,
  transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.shortest }),
  ...($hidden && { opacity: 0 })
}))

// ADR-292: the deterministic per-name color paints behind the face256 (which
// can have a transparent background) so identity hue matches in-world.
const CreatorAvatar = styled('img', { shouldForwardProp: prop => prop !== '$bg' })<{ $bg?: string }>(({ $bg }) => ({
  width: '4.426cqw', // 19px
  height: '4.426cqw',
  borderRadius: '50%',
  objectFit: 'cover',
  flexShrink: 0,
  border: '0.316cqw solid rgba(255, 255, 255, 0.5)', // 1.357px
  backgroundColor: $bg
}))

const ByText = styled(Typography)({
  minWidth: 0,
  fontSize: '2.796cqw', // 12px — typography/caption
  fontWeight: 400,
  lineHeight: 1,
  color: SNOW,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const CreatorName = styled('span')({
  color: RUBY
})

// Bottom slot — location by default, JUMP IN on hover.
const BottomSwap = styled(Box)({
  position: 'relative',
  minHeight: '7.688cqw', // 33px — the CTA height
  display: 'flex',
  alignItems: 'flex-end'
})

const LocationRow = styled(Box, { shouldForwardProp: prop => prop !== '$hidden' })<{ $hidden?: boolean }>(({ theme, $hidden }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.903cqw', // 3.875px
  padding: '0.466cqw 1.864cqw 0.466cqw 0.932cqw', // 2px 8px 2px 4px
  borderRadius: '1.354cqw', // 5.813px
  backgroundColor: LOC_BG,
  fontSize: '3.261cqw', // 14px — typography/body2
  fontWeight: 400,
  lineHeight: 1.43,
  color: GRAY5,
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.shortest }),
  ...($hidden && { opacity: 0 })
}))

const JumpInButton = styled('button', { shouldForwardProp: prop => prop !== '$visible' })<{ $visible?: boolean }>(
  ({ theme, $visible }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.979cqw', // 8.496px
    width: '100%',
    height: '7.688cqw', // 33px
    border: 'none',
    borderRadius: '1.864cqw', // 8px
    backgroundColor: RUBY,
    color: SNOW,
    fontSize: '3.028cqw', // 13px — button/small
    fontWeight: 600,
    letterSpacing: '0.107cqw', // 0.46px
    textTransform: 'uppercase',
    cursor: 'pointer',
    opacity: 0,
    pointerEvents: 'none',
    transition: theme.transitions.create(['opacity', 'background-color'], { duration: theme.transitions.duration.shortest }),
    ...($visible && { opacity: 1, pointerEvents: 'auto' }),
    // Same press feedback as the whats-on Live Now CTA.
    ['&:hover']: { backgroundColor: theme.palette.primary.dark },
    ['&:active']: { backgroundColor: theme.palette.primary.dark },
    ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
  })
)

export {
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
}

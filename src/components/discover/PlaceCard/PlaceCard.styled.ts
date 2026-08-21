import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../utils/safeCssUrl'
import { CARD_BG, HOVER_GLOW, MEDIA_FALLBACK } from '../_shared/DiscoverShell.styled'

// Big place/scene card — pixel-matched to the "Places - Desktop" Figma
// (PlacesCards component, 435.25×346, designed on a 1920px frame).
//
// All internal dimensions are expressed in `cqw` (container-query width units)
// relative to the Figma card width of 435.25px — i.e. `Npx` in the Figma is
// `N / 435.25 * 100` cqw here. The card is therefore a proportional replica of
// the design at ANY grid column width: on a true 1920px viewport it renders at
// exactly the Figma's pixel values, and on smaller viewports it scales down
// uniformly (the "67% browser zoom looks right" effect, built in).
const SNOW = dclColors.neutral.softWhite // DCL/Snow, DCL/White (#fcfcfc)
const GRAY5 = dclColors.neutral.gray5 // neutrals/gray-5 (#ecebed)
const RUBY = dclColors.base.primary // DCL/Ruby (#ff2d55) — creator name + JUMP IN
const LOC_BG = 'rgba(255, 255, 255, 0.05)'

// The query container — the grid cell. Everything inside resolves cqw against
// this element's width.
const CardContainer = styled(Box)({
  containerType: 'inline-size',
  width: '100%'
})

const Card = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: '5.514cqw', // 24px
  overflow: 'hidden',
  cursor: 'pointer',
  backgroundColor: CARD_BG,
  transition: theme.transitions.create('box-shadow', { duration: theme.transitions.duration.short }),
  ['&:hover']: { boxShadow: HOVER_GLOW },
  ['&:focus-visible']: { outline: `2px solid ${RUBY}`, outlineOffset: 2 },
  // Pin the Figma radius on the narrow mobile card (cqw would shrink it).
  [theme.breakpoints.down('sm')]: { borderRadius: 24 }
}))

// Media frame — 435.25 : 222 aspect from the Figma, holds the cover + badges.
const Media = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: '435.25 / 222',
  padding: '2.757cqw 2.757cqw 0', // 12px
  borderRadius: '5.514cqw 5.514cqw 0 0',
  overflow: 'hidden',
  backgroundColor: MEDIA_FALLBACK
})

// Cover via background-image so a missing/404 cover degrades to the solid
// fallback (no broken-image icon).
const Cover = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<{ $image?: string }>(({ $image }) => ({
  position: 'absolute',
  inset: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  ...($image && { backgroundImage: `url("${safeCssUrl($image)}")` })
}))

const Body = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2.757cqw', // 12px
  padding: '3.676cqw 5.514cqw 5.514cqw', // 16px 24px 24px
  width: '100%'
})

const Title = styled(Typography)({
  fontSize: '4.595cqw', // 20px — typography/h6, Inter Medium
  fontWeight: 500,
  lineHeight: 1.6,
  color: SNOW,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

// Reserves the JUMP IN button's height so the card doesn't jump on hover; both
// the meta row and the button are bottom-anchored so they share the same 24px
// margin to the card's left/right/bottom (from the Body padding).
const SwapArea = styled(Box)({
  position: 'relative',
  minHeight: '10.953cqw' // 47.674px — the CTA height
})

const MetaRow = styled(Box, { shouldForwardProp: prop => prop !== '$hidden' })<{ $hidden?: boolean }>(({ theme, $hidden }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2.298cqw', // 10px
  transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.shortest }),
  ...($hidden && { opacity: 0, pointerEvents: 'none' })
}))

const CreatorRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '2.298cqw', // 10px
  minWidth: 0,
  flex: 1
})

// ADR-292: the deterministic per-name color paints behind the face256 (which
// can have a transparent background) so identity hue matches in-world.
const Avatar = styled('img', { shouldForwardProp: prop => prop !== '$bg' })<{ $bg?: string }>(({ $bg }) => ({
  width: '7.352cqw', // 32px
  height: '7.352cqw',
  borderRadius: '50%',
  objectFit: 'cover',
  flexShrink: 0,
  border: '0.525cqw solid rgba(255, 255, 255, 0.5)', // 2.286px
  backgroundColor: $bg
}))

const ByText = styled(Typography)({
  minWidth: 0,
  fontSize: '3.217cqw', // 14px — typography/subtitle2, Inter Semi-Bold
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

const LocationPill = styled(Box)({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.890cqw', // 3.875px
  padding: '0.890cqw 1.781cqw 0.890cqw 0.890cqw', // 3.875px 7.75px 3.875px 3.875px
  borderRadius: '1.336cqw', // 5.813px
  backgroundColor: LOC_BG,
  fontSize: '3.217cqw', // 14px — typography/body2
  fontWeight: 400,
  lineHeight: 1.43,
  color: GRAY5
})

const JumpInButton = styled('button', { shouldForwardProp: prop => prop !== '$visible' })<{ $visible?: boolean }>(
  ({ theme, $visible }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.952cqw', // 8.496px
    width: '100%',
    height: '10.953cqw', // 47.674px
    border: 'none',
    borderRadius: '2.757cqw', // 12px
    backgroundColor: RUBY,
    color: SNOW,
    fontSize: '3.809cqw', // 16.58px — Inter Bold
    fontWeight: 700,
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
  Avatar,
  Body,
  ByText,
  Card,
  CardContainer,
  Cover,
  CreatorName,
  CreatorRow,
  JumpInButton,
  LocationPill,
  Media,
  MetaRow,
  SwapArea,
  Title
}

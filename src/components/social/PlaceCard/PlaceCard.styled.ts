import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const Card = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  backgroundColor: dclColors.blackTransparent.backdrop,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  ['&:hover']: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
    borderColor: dclColors.whiteTransparent.blurry
  }
}))

// Wraps the cover + body in a real anchor so the cover image and title are
// proper click targets that navigate to the scene detail. The JUMP IN button
// in the Actions row sits OUTSIDE this anchor so it can launch the protocol
// without nested interactive elements.
const CardLink = styled('a')({
  display: 'flex',
  flexDirection: 'column',
  color: 'inherit',
  textDecoration: 'none',
  flex: 1,
  minHeight: 0,
  cursor: 'pointer',
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: -2
  }
})

const Cover = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: dclColors.neutral.softBlack1
})

const CoverImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
  pointerEvents: 'none',
  userSelect: 'none'
})

// Shown when the place image is missing or fails to load. Matches the
// CommunityCard fallback shape so empty/broken cards stay on-brand instead
// of showing the browser's broken-image glyph.
const CoverFallback = styled(Box)({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #4a2475 0%, #1a0b2e 100%)'
})

const FallbackDisc = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  fontWeight: 700,
  color: dclColors.neutral.softWhite,
  background: theme.palette.primary.main,
  textTransform: 'uppercase',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
}))

const Body = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  padding: theme.spacing(1.5, 1.75),
  backgroundColor: dclColors.blackTransparent.blurry,
  flex: 1,
  minHeight: 0
}))

const Title = styled(Typography)({
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.35,
  color: dclColors.neutral.softWhite,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const Meta = styled(Typography)({
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: dclColors.neutral.gray3,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const Actions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(0, 1.75, 1.75)
}))

const Pill = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  height: 22,
  padding: theme.spacing(0, 1),
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  lineHeight: 1,
  zIndex: 1
}))

const LiveBadge = styled(Pill)({
  left: 8,
  background: dclColors.brand.ruby,
  color: dclColors.neutral.softWhite
})

const LiveDot = styled('span')({
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#fff',
  display: 'inline-block'
})

const UsersBadge = styled(Pill)({
  right: 8,
  backgroundColor: dclColors.blackTransparent.backdrop,
  color: dclColors.neutral.softWhite
})

const ACTION_BUTTON_HEIGHT = 36

// Both action buttons share the same shape so they line up cleanly side by
// side. JumpInButton is the brand action (filled), WatchButton is the
// neutral action (outlined). Both stay outside the cover/title anchor so we
// avoid invalid nested-interactive markup.
const ActionButton = styled(Button)({
  flex: 1,
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: '0.06em',
  height: ACTION_BUTTON_HEIGHT,
  whiteSpace: 'nowrap',
  fontSize: 12
})

export {
  ActionButton,
  Actions,
  Body,
  Card,
  CardLink,
  Cover,
  CoverFallback,
  CoverImage,
  FallbackDisc,
  LiveBadge,
  LiveDot,
  Meta,
  Title,
  UsersBadge
}

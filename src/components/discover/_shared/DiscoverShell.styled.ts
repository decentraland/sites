import { Box, TextField, Typography, dclColors, styled } from 'decentraland-ui2'

// Placeholder behind cover images while they load / when a place has none.
const MEDIA_FALLBACK = '#2a2435'

// Card tokens with no dclColors equivalent, shared by every discover card
// surface (PlaceCard / LiveEventCard / FeaturedCard / SceneJumpInModal).
const LIVE_RED = '#ff0000' // LIVE badge — Figma uses pure red
const ONLINE_GREEN = '#30cd00' // connection dot
const CARD_BG = 'rgba(0, 0, 0, 0.4)'
const HOVER_GLOW = '0px 2px 12px 12px rgba(255, 255, 255, 0.3)'
const FEATURED_GRADIENT = 'linear-gradient(149.456deg, #FFBC5B 0%, #FF2D55 50.521%, #C640CD 100%)' // Featured badge fill
// Figma "RADIAL 1" purple — the panel fill shared by the scene page content,
// the JUMP IN modal and the watcher's info panel.
const SCENE_PANEL_GRADIENT = 'radial-gradient(47.39% 84.22% at 42.4% 26.48%, #6E31A7 0%, #32134C 100%)'

// ── Card cover badges ────────────────────────────────────────────────────
// Shared by PlaceCard and LiveEventCard. All dimensions are cqw so each card
// resolves them against its own container width (the values are the Figma px
// on PlaceCard's 435.25px frame; LiveEventCard's 405.25px frame renders them
// proportionally, matching its slightly smaller card).
const TopRow = styled(Box)({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'min(1.838cqw, 8px)',
  width: '100%',
  pointerEvents: 'none'
})

const FeaturedBadge = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'min(0.919cqw, 4px)',
  height: 'min(5.974cqw, 26px)',
  padding: 'min(1.149cqw, 5px) min(1.379cqw, 6px)',
  borderRadius: 'min(1.838cqw, 8px)',
  background: FEATURED_GRADIENT,
  color: dclColors.neutral.softWhite,
  fontSize: 'min(3.217cqw, 14px)',
  fontWeight: 600,
  lineHeight: 1
})

// The page fills the viewport width, bounded only by the 32px side gutters —
// matching the Figma, where the content is the frame minus its gutters (not a
// fixed column). A former 1792px max-width capped the rails to a centered
// column and left empty gutters on monitors wider than ~1856px; going
// full-bleed keeps the rails aligned with the full-width tab nav at every
// resolution. Viewports below the old cap (e.g. laptop screens) are unchanged.
const PageContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2),
  width: '100%',
  [theme.breakpoints.up('md')]: { padding: theme.spacing(4) }
}))

// Sentence-case title matching the scene-detail `SceneTitle` so every
// /discover surface that needs a page heading reads the same way.
const PageTitle = styled(Typography)({
  fontSize: 28,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  marginRight: 'auto',
  lineHeight: 1.24
})

const HeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
  rowGap: theme.spacing(1.5)
}))

// Explore grid — the Figma card is 435px wide (4 columns at the 1789px content
// width). Fixed column counts keep cards near that width: 3-up on typical
// desktops (~440px), stepping to the full 4-up only on very wide screens, and
// down to 2/1 on tablet/phone. This avoids both the too-narrow 4-up and the
// ballooned 2-up on medium / Retina viewports.
const CardGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  [theme.breakpoints.up('md')]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  [theme.breakpoints.up('lg')]: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }
}))

const Empty = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.gray3,
  textAlign: 'center',
  padding: theme.spacing(8, 2),
  fontSize: 14
}))

// Failed-query state: message + retry, so an API outage is distinguishable
// from a genuinely empty catalog (the empty copy would lie during downtime).
const ErrorBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(8, 2)
}))

const ErrorText = styled(Typography)({
  color: dclColors.neutral.gray3,
  textAlign: 'center',
  fontSize: 14
})

const RetryButton = styled('button')(({ theme }) => ({
  border: 'none',
  borderRadius: 8,
  padding: theme.spacing(1, 3),
  backgroundColor: dclColors.base.primary,
  color: dclColors.neutral.softWhite,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'opacity'], { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:active']: { backgroundColor: dclColors.base.primaryDark1 },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 },
  ['&:disabled']: { opacity: 0.5, cursor: 'default' }
}))

// Search pill from the Figma toolbar: fully rounded (50px), rgba(0,0,0,0.2)
// fill with a hairline gray-4 border, 24px leading magnifier, 17px snow text
// (-0.2px tracking), 520px wide on desktop.
const SearchField = styled(TextField)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 'clamp(340px, 27.083vw, 520px)',
    flexShrink: 1
  },
  ['& .MuiInputBase-root']: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: dclColors.neutral.softWhite,
    borderRadius: 50,
    fontSize: 'clamp(14px, 0.885vw, 17px)',
    letterSpacing: '-0.2px',
    height: 'clamp(38px, 2.396vw, 46px)', // 10px padding + 26px line (Figma)
    paddingLeft: theme.spacing(2)
  },
  // Figma gap between the search icon and the text is exactly 8px -- the
  // start adornment's built-in 8px margin supplies it, so the input itself
  // gets no extra left padding.
  ['& .MuiInputBase-input']: {
    padding: theme.spacing(1.25, 2, 1.25, 0)
  },
  ['& .MuiOutlinedInput-notchedOutline']: {
    border: `0.5px solid ${dclColors.neutral.gray4}`
  },
  ['& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline']: {
    borderColor: dclColors.neutral.softWhite
  },
  ['& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline']: {
    borderColor: theme.palette.primary.main,
    borderWidth: 1
  },
  ['& .MuiInputBase-input::placeholder']: {
    color: dclColors.neutral.softWhite,
    opacity: 0.8
  },
  // Keep the dark theme when the browser autofills / applies a saved value —
  // the default `:-webkit-autofill` background is an opaque light fill the
  // normal backgroundColor can't override (only the inset box-shadow hack can),
  // which otherwise repaints the search bar light with invisible text (#721).
  ['& .MuiInputBase-input:-webkit-autofill']: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- CSS vendor property
    WebkitTextFillColor: dclColors.neutral.softWhite,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- CSS vendor property
    WebkitBoxShadow: '0 0 0 1000px rgba(0, 0, 0, 0.2) inset',
    caretColor: dclColors.neutral.softWhite,
    transition: 'background-color 9999s ease-in-out 0s'
  },
  ['& .MuiSvgIcon-root']: {
    color: dclColors.neutral.softWhite
  }
}))

export {
  CARD_BG,
  FEATURED_GRADIENT,
  SCENE_PANEL_GRADIENT,
  HOVER_GLOW,
  LIVE_RED,
  MEDIA_FALLBACK,
  ONLINE_GREEN,
  CardGrid,
  Empty,
  FeaturedBadge,
  TopRow,
  ErrorBox,
  ErrorText,
  HeaderRow,
  PageContent,
  PageTitle,
  RetryButton,
  SearchField
}

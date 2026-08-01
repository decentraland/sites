import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { SCENE_PANEL_GRADIENT } from '../../components/discover/_shared/DiscoverShell.styled'

// Scene detail (live view) — pixel-matched to the Figma frame 2151:30900
// (1643×1128): two columns — the viewer card (header bar + bevy watcher +
// controls bar) with the WHAT TO EXPECT panel below on the left, and the
// In-World Chat panel on the right, matching the viewer card's height.
const SNOW = dclColors.neutral.softWhite // #fcfcfc
const GRAY3 = dclColors.neutral.gray3 // #a09ba8
const SOFT_BLACK = dclColors.neutral.softBlack1 // #161518
const RUBY = dclColors.base.primary // #ff2d55

const Content = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3), // 24px between viewer card, chat and info panel
  width: '100%',
  margin: '0 auto',
  padding: theme.spacing(3, 2, 6),
  // Figma frame 2151:30900: content is 1643px on the 1920 frame (85.6%),
  // split into viewer column (1fr) + 441px chat column. The chat cell spans
  // only row 1, so it always matches the viewer card's height. The width is
  // the Figma's 85.6% proportion at every resolution — a former `min(1643px, …)`
  // cap pinned the two columns to a centered 1643px column on monitors wider
  // than ~1919px, leaving empty gutters; keeping pure 85.6vw scales with the
  // viewport like the design. Narrower viewports were already on 85.6vw, so
  // they are unchanged.
  [theme.breakpoints.up('md')]: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) clamp(300px, 22.97vw, 441px)', // 441px at 1920
    gridTemplateRows: 'auto auto',
    maxWidth: '85.6vw',
    padding: theme.spacing(4, 0, 8)
  }
}))

// Right column cell for the In-World Chat. On desktop the dock absolutely
// fills the cell so the chat never stretches row 1 beyond the viewer card;
// on mobile it flows under the viewer with a fixed usable height.
const ChatColumn = styled(Box)(({ theme }) => ({
  position: 'relative',
  minWidth: 0,
  height: 420,
  [theme.breakpoints.up('md')]: { gridColumn: 2, gridRow: 1, height: 'auto' }
}))

const ChatFill = styled(Box)(({ theme }) => ({
  height: '100%',
  [theme.breakpoints.up('md')]: { position: 'absolute', inset: 0 }
}))

// The viewer card — header + watcher + controls read as one rounded block.
const ViewerCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  borderRadius: 'clamp(16px, 1.25vw, 24px)', // 24px at the Figma's 1920 frame
  overflow: 'hidden',
  [theme.breakpoints.up('md')]: { gridColumn: 1, gridRow: 1 }
}))

// Header bar: soft-black, px-24 py-16, title left / creator + coords +
// JUMP IN right.
const ViewerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  padding: 'clamp(10px, 0.833vw, 16px) clamp(16px, 1.25vw, 24px)', // 16px 24px
  backgroundColor: SOFT_BLACK
}))

const SceneTitle = styled(Typography)({
  fontSize: 'clamp(22px, 1.667vw, 32px)', // 32px
  fontWeight: 600,
  lineHeight: 1.235,
  color: SNOW,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const HeaderRight = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2) // 16px
}))

const CreatorRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0
})

// ADR-292: deterministic per-name color behind the face256 snapshot.
const Avatar = styled('img', { shouldForwardProp: prop => prop !== '$bg' })<{ $bg?: string }>(({ $bg }) => ({
  width: 'clamp(22px, 1.458vw, 28px)', // 28px
  height: 'clamp(22px, 1.458vw, 28px)',
  borderRadius: '50%',
  objectFit: 'cover',
  flexShrink: 0,
  border: '2px solid rgba(255, 255, 255, 0.5)',
  backgroundColor: $bg
}))

const ByText = styled(Typography)({
  fontSize: 'clamp(15px, 1.042vw, 20px)', // 20px — typography/h6 in the header
  fontWeight: 500,
  lineHeight: 1.6,
  color: SNOW,
  whiteSpace: 'nowrap'
})

const CreatorName = styled('span')({
  color: RUBY,
  fontWeight: 500
})

const LocationTag = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  borderRadius: 8,
  fontSize: 'clamp(12px, 0.729vw, 14px)', // 14px
  fontWeight: 400,
  lineHeight: 1.43,
  color: SNOW
})

// WHAT TO EXPECT panel — r24, px-32 py-24, purple radial gradient.
const InfoPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
  borderRadius: 'clamp(16px, 1.25vw, 24px)', // 24px
  padding: 'clamp(16px, 1.25vw, 24px) clamp(20px, 1.667vw, 32px)', // 24px 32px
  background: SCENE_PANEL_GRADIENT,
  [theme.breakpoints.up('md')]: { gridColumn: 1, gridRow: 2 }
}))

const InfoLabel = styled(Typography)({
  fontSize: 'clamp(13px, 0.833vw, 16px)', // 16px
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  color: GRAY3
})

const InfoText = styled(Typography)({
  fontSize: 'clamp(13px, 0.833vw, 16px)', // 16px
  fontWeight: 400,
  lineHeight: 1.5,
  color: dclColors.neutral.white,
  whiteSpace: 'pre-wrap'
})

// Multi-scene worlds keep the scene picker (not part of the Figma frame, but
// functionally required to choose which world scene the watcher joins).
const ScenePickerRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap'
}))

const ScenePickerLabel = styled('span')({
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: GRAY3
})

const ScenePickerSelect = styled('select')(({ theme }) => ({
  appearance: 'none',
  padding: theme.spacing(1, 4, 1, 1.5),
  borderRadius: 8,
  border: `1px solid ${dclColors.whiteTransparent.blurry}`,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  color: SNOW,
  fontSize: 14,
  fontFamily: 'inherit',
  cursor: 'pointer',
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'><path d='M1 1l4 4 4-4' stroke='%23FCFCFC' stroke-width='1.5' stroke-linecap='round'/></svg>\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  ['&:focus-visible']: { outline: `2px solid ${RUBY}`, outlineOffset: 2 }
}))

const NotFound = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  minHeight: '50vh',
  textAlign: 'center'
}))

const NotFoundHint = styled(Typography)({
  fontSize: 14,
  color: GRAY3
})

export {
  Avatar,
  ByText,
  ChatColumn,
  ChatFill,
  Content,
  CreatorName,
  CreatorRow,
  HeaderRight,
  InfoLabel,
  InfoPanel,
  InfoText,
  LocationTag,
  NotFound,
  NotFoundHint,
  ScenePickerLabel,
  ScenePickerRow,
  ScenePickerSelect,
  SceneTitle,
  ViewerCard,
  ViewerHeader
}

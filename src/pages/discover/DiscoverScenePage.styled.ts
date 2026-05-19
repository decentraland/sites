import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

// Scene detail content area. Mobile: single column stack. Desktop: 2 columns
// — hero (watcher + info) on the left, chat dock as a permanent right-side
// rail. The chat tile has a fixed height (configured below in ChatArea) so
// long conversations scroll inside the tile instead of growing the page.
const Content = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2),
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(3),
  alignItems: 'start',
  maxWidth: 1440,
  marginInline: 'auto',
  width: '100%',
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
    gridTemplateColumns: 'minmax(0, 1fr) 380px'
  }
}))

const HeroArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  minWidth: 0
}))

// Chat tile has a fixed height to avoid the page growing on every new message.
// Height matches the typical watcher+info card stack height so the column
// edges align cleanly. Mobile gets a smaller fixed height so the page still
// flows naturally.
const CHAT_HEIGHT_MOBILE = 420
const CHAT_HEIGHT_DESKTOP = 640

const ChatArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: CHAT_HEIGHT_MOBILE,
  [theme.breakpoints.up('md')]: {
    height: CHAT_HEIGHT_DESKTOP,
    position: 'sticky',
    top: theme.spacing(13)
  }
}))

const InfoCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  backgroundColor: dclColors.blackTransparent.backdrop,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const TitleStack = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0
}))

// Inline scene picker shown on multi-scene world detail pages. Uses a native
// <select> styled to match the rest of the sidebar — keyboard-accessible by
// default and saves us a heavier MUI Select dropdown for one field.
const ScenePickerRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75)
}))

const ScenePickerLabel = styled('span')({
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: dclColors.neutral.gray3,
  fontWeight: 600
})

const ScenePickerSelect = styled('select')(({ theme }) => ({
  appearance: 'none',
  width: '100%',
  padding: theme.spacing(1.25, 4, 1.25, 1.5),
  borderRadius: 8,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  background: `${dclColors.whiteTransparent.subtle} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23a39eb5' d='M5 6 0 0h10z'/%3E%3C/svg%3E") no-repeat right ${theme.spacing(1.5)} center`,
  color: dclColors.neutral.softWhite,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  ['&:hover']: { borderColor: dclColors.whiteTransparent.blurry },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  },
  ['& option']: {
    backgroundColor: dclColors.neutral.softBlack1,
    color: dclColors.neutral.softWhite
  }
}))

// Mirrors the whats-on PlaceDetailModal hero/content typography so the
// scene-detail surface reads as the same family of pages: sentence-case
// title, light "ABOUT/LOCATION" section labels above each block, location
// with an icon, and a white pill JUMP IN button (not the brand-red
// contained button — that was over-loud for an always-visible side card).
const SceneTitle = styled(Typography)({
  fontSize: 32,
  fontWeight: 600,
  lineHeight: 1.24,
  color: dclColors.neutral.softWhite
})

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: dclColors.neutral.gray3,
  marginBottom: theme.spacing(0.5)
}))

const MetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap'
}))

const MetaText = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: 14,
  lineHeight: 1.5,
  color: dclColors.neutral.softWhite,
  ['& svg']: { fontSize: 18 }
}))

const SceneDescription = styled(Typography)({
  fontSize: 14,
  color: dclColors.neutral.softWhite,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
})

const ContentDivider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: dclColors.whiteTransparent.subtle,
  margin: theme.spacing(0.5, 0)
}))

const PrimaryButton = styled(Button)(({ theme }) => ({
  alignSelf: 'flex-start',
  height: 46,
  backgroundColor: dclColors.neutral.softWhite,
  color: dclColors.neutral.softBlack1,
  borderRadius: theme.spacing(1.5),
  paddingInline: theme.spacing(3),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  ['&:hover']: { backgroundColor: 'rgba(252, 252, 252, 0.85)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

const NotFound = styled(Box)(({ theme }) => ({
  gridColumn: '1 / -1',
  padding: theme.spacing(8, 2),
  textAlign: 'center',
  color: dclColors.neutral.softWhite,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2)
}))

const NotFoundHint = styled(Typography)({
  fontSize: 14,
  color: dclColors.neutral.gray3,
  maxWidth: 520
})

export {
  ChatArea,
  Content,
  ContentDivider,
  HeroArea,
  InfoCard,
  MetaRow,
  MetaText,
  NotFound,
  NotFoundHint,
  PrimaryButton,
  SceneDescription,
  ScenePickerLabel,
  ScenePickerRow,
  ScenePickerSelect,
  SceneTitle,
  SectionLabel,
  TitleStack
}

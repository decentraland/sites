import { Box, Skeleton, Typography, dclColors, styled } from 'decentraland-ui2'

const PageRoot = styled(Box)(({ theme }) => ({
  maxWidth: 1280,
  marginInline: 'auto',
  width: '100%',
  padding: theme.spacing(4, 2, 8),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  color: dclColors.neutral.softWhite,
  [theme.breakpoints.up('md')]: { padding: theme.spacing(5, 4, 10) }
}))

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

// Uppercase eyebrow above the page title — the design-system SectionLabel idiom.
const Eyebrow = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.6,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: dclColors.neutral.gray3,
  marginBottom: theme.spacing(0.5)
}))

const Title = styled(Typography)({
  fontSize: 34,
  fontWeight: 700,
  lineHeight: 1.15
})

const Subtitle = styled(Typography)({
  fontSize: 15,
  lineHeight: 1.5,
  color: dclColors.neutral.gray3,
  maxWidth: 640
})

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2.5),
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
}))

// Skeleton card matching the WorldCreationCard footprint (thumbnail + two lines).
const CardSkeleton = styled(Skeleton)(({ theme }) => ({
  transform: 'none',
  height: 0,
  paddingTop: '74%',
  borderRadius: theme.spacing(2),
  backgroundColor: dclColors.whiteTransparent.subtle
}))

const StateBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  textAlign: 'center',
  padding: theme.spacing(10, 2),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  borderRadius: theme.spacing(2),
  backgroundColor: dclColors.blackTransparent.backdrop,
  color: dclColors.neutral.gray3,
  ['& svg']: { fontSize: 40, color: dclColors.neutral.gray3, marginBottom: theme.spacing(0.5) }
}))

const EmptyTitle = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  color: dclColors.neutral.softWhite
})

const EmptyHint = styled(Typography)({
  fontSize: 14,
  color: dclColors.neutral.gray3,
  maxWidth: 420
})

export { CardSkeleton, CardsGrid, EmptyHint, EmptyTitle, Eyebrow, Header, PageRoot, StateBox, Subtitle, Title }

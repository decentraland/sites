import { Box, TextField, Typography, dclColors, styled } from 'decentraland-ui2'

// Constrains content width on huge displays so card grids don't grow wider
// than is comfortable to scan. 1440 matches the site's content guideline.
const CONTENT_MAX_WIDTH = 1440

const PageContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2),
  width: '100%',
  maxWidth: CONTENT_MAX_WIDTH,
  marginInline: 'auto',
  [theme.breakpoints.up('md')]: { padding: theme.spacing(4) }
}))

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h4.fontSize,
  fontWeight: 700,
  color: dclColors.neutral.softWhite,
  marginRight: 'auto',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  lineHeight: 1.1
}))

const HeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(4),
  rowGap: theme.spacing(1.5)
}))

const CardGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(264px, 1fr))'
  }
}))

// Matches `CenteredBox` (the DappsShell Suspense fallback) — same 60vh
// vertical center so when the lazy chunk finishes loading and the page's
// own loader takes over, the spinner stays anchored in place instead of
// jumping. On mobile this is what eliminated the "two loaders" perception
// (chunk spinner at one Y position, data spinner at another).
const Loader = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh'
})

const Empty = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.gray3,
  textAlign: 'center',
  padding: theme.spacing(8, 2),
  fontSize: 14
}))

const SearchField = styled(TextField)({
  minWidth: 240,
  ['& .MuiInputBase-root']: {
    backgroundColor: dclColors.whiteTransparent.subtle,
    color: dclColors.neutral.softWhite,
    borderRadius: 8,
    fontSize: 13
  },
  ['& .MuiOutlinedInput-notchedOutline']: {
    borderColor: dclColors.whiteTransparent.subtle
  },
  ['& .MuiInputBase-input::placeholder']: {
    color: dclColors.neutral.gray3,
    opacity: 1
  }
})

export { CardGrid, Empty, HeaderRow, Loader, PageContent, PageTitle, SearchField }

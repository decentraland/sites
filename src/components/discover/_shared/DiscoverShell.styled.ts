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

// Compact search input that sits to the right of the category tabs in
// the filters bar. Pairs with a leading <SearchIcon /> via InputAdornment
// in the page. Full width on mobile (stacked below tabs); fixed compact
// width on tablet+ so it doesn't dwarf the tab strip.
const SearchField = styled(TextField)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 280,
    flexShrink: 0
  },
  ['& .MuiInputBase-root']: {
    backgroundColor: dclColors.whiteTransparent.subtle,
    color: dclColors.neutral.softWhite,
    borderRadius: 10,
    fontSize: 14,
    height: 40,
    paddingLeft: theme.spacing(1.5)
  },
  ['& .MuiInputBase-input']: {
    padding: theme.spacing(1, 1.5, 1, 1)
  },
  ['& .MuiOutlinedInput-notchedOutline']: {
    borderColor: 'transparent'
  },
  ['& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline']: {
    borderColor: dclColors.whiteTransparent.blurry
  },
  ['& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline']: {
    borderColor: theme.palette.primary.main,
    borderWidth: 1
  },
  ['& .MuiInputBase-input::placeholder']: {
    color: dclColors.neutral.gray3,
    opacity: 1
  },
  ['& .MuiSvgIcon-root']: {
    color: dclColors.neutral.gray3
  }
}))

export { CardGrid, Empty, HeaderRow, Loader, PageContent, PageTitle, SearchField }

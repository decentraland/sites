import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

// One bar combining the category tab strip + the search field. Single row
// on tablet+ (tabs left, search right) sharing the same baseline so they
// read as one control. Stacks on mobile — tabs above search — because
// 360 px viewport can't fit both side-by-side without squeezing one.
const FiltersBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing(2)
  }
}))

// Text-tab category strip. No background fill, no chip border — just text
// + a primary-color underline below the active label that tucks into the
// row's own bottom border so the row's line "lights up" rather than
// stacking a second indicator. Always scrolls horizontally so the row
// stays one line regardless of viewport.
const CategoryTabs = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  paddingBottom: theme.spacing(0.5),
  borderBottom: `1px solid ${dclColors.whiteTransparent.subtle}`,
  scrollbarWidth: 'none',
  ['&::-webkit-scrollbar']: { display: 'none' }
}))

interface CategoryTabProps {
  $active?: boolean
}

const CategoryTab = styled('button', { shouldForwardProp: prop => prop !== '$active' })<CategoryTabProps>(({ theme, $active }) => ({
  position: 'relative',
  appearance: 'none',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  padding: theme.spacing(1.25, 1.5),
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.01em',
  textTransform: 'capitalize',
  color: $active ? dclColors.neutral.softWhite : dclColors.neutral.gray3,
  transition: 'color 150ms ease',
  ['&:hover']: { color: dclColors.neutral.softWhite },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 },
  ['&::after']: {
    content: '""',
    position: 'absolute',
    left: theme.spacing(1.5),
    right: theme.spacing(1.5),
    bottom: -1,
    height: 2,
    borderRadius: '2px 2px 0 0',
    backgroundColor: $active ? theme.palette.primary.main : 'transparent',
    transition: 'background-color 150ms ease'
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: dclColors.neutral.gray3,
  margin: theme.spacing(2, 0, 1.5)
}))

export { CategoryTab, CategoryTabs, FiltersBar, SectionTitle }

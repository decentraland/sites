// eslint-disable-next-line @typescript-eslint/naming-convention -- MUI icon default export
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Drawer, IconButton, Select, Typography, dclColors, styled } from 'decentraland-ui2'
import { SearchField } from '../../components/discover/_shared'

// Track floor for both rails that render decentraland-ui2's EventSmallCard: the
// card carries a 300px minimum, and a 4-up row spends three 24px gaps, so a
// narrower track would overflow the card instead of dropping a column.
const SHARED_CARD_TRACK = 'max(300px, calc((100% - 72px) / 4))'

// Exact tokens from the "Places - Desktop" Figma.
const SNOW = dclColors.neutral.softWhite // #fcfcfc
const SOFT_BLACK = dclColors.neutral.softBlack1 // #161518
const GRAY5 = dclColors.neutral.gray5 // #ecebed

// Full-bleed band behind the toolbar + explore grid. In the Figma the section
// darkens the page gradient by exactly a 20% black overlay (sampled: both the
// left-edge and center colors drop by 0.8x at the boundary), so we break out
// to 100vw and let the page radial show through underneath.
const ExploreBand = styled(Box)(({ theme }) => ({
  width: '100vw',
  marginLeft: 'calc(50% - 50vw)',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  marginTop: theme.spacing(6),
  padding: theme.spacing(6, 0, 8),
  // A tab switch re-anchors this band to the top; offset it so the fixed navbar
  // (64px mobile / 92px desktop) doesn't cover the toolbar.
  scrollMarginTop: 72,
  [theme.breakpoints.up('md')]: { scrollMarginTop: 100 }
}))

// Re-aligns the band's children (the band itself broke out to 100vw) back onto
// the same full-width padded column as PageContent, so the toolbar and grid
// stay aligned with the rails at every resolution.
const ExploreBandContent = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(0, 2),
  [theme.breakpoints.up('md')]: { padding: theme.spacing(0, 4) }
}))

// Toolbar — on desktop a single row (tabs left, search + dropdowns right); on
// mobile it stacks: a horizontally-scrollable tab row, then a search + filter-
// button row, per the "MOBILE BEST" Figma (2019:81805).
const ExploreToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: theme.spacing(2), // Figma gap-16
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center'
  }
}))

// Experiences tabs. Scrolls horizontally on mobile (the three pills overflow a
// phone width); a plain inline group on desktop.
const TabsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  overflowX: 'auto',
  scrollbarWidth: 'none',
  ['&::-webkit-scrollbar']: { display: 'none' },
  [theme.breakpoints.up('md')]: { flex: '0 0 auto', overflowX: 'visible' }
}))

// Search + filters cluster. Full-width row on mobile (search grows, filter
// button pinned to its right); right-aligned inline group on desktop — this
// replaces the old flex-spacer.
const ControlsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.up('md')]: { flex: 1, width: 'auto', justifyContent: 'flex-end' }
}))

// Lets the search field grow to fill the mobile row beside the filter button,
// while keeping its fixed clamp width on desktop.
const SearchSlot = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  minWidth: 0,
  [theme.breakpoints.up('md')]: { flex: '0 0 auto' }
}))

// The toolbar search. Desktop is the shared fully-rounded pill; mobile is the
// Figma's 8px-radius field (2018:49188). Scoped to the discover toolbar so the
// shared SearchField (communities / friends) is untouched.
const ToolbarSearchField = styled(SearchField)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    ['& .MuiInputBase-root']: { borderRadius: 8 }
  }
}))

// The inline Category + Sort dropdowns — desktop only. On mobile they move into
// the filter drawer, opened by FilterButton.
const DesktopFilters = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('md')]: { display: 'flex', alignItems: 'center', gap: theme.spacing(2) }
}))

// Sliders button that opens the filter drawer — mobile only (Figma 2019:76192:
// rgba(0,0,0,0.4) fill, 8px radius, 40×40).
const FilterButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 40,
  height: 40,
  padding: 0,
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  color: SNOW,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 },
  [theme.breakpoints.up('md')]: { display: 'none' }
}))

// "Experiences tabs" pill from the Figma: rounded-50, px-16 py-8, gap-8,
// 15px Inter Semi-Bold uppercase (0.46px tracking, 24px line), 24px icon.
// Active: soft-white fill + soft-black text. Inactive: white @ 10% + snow.
const TabPill = styled('button', { shouldForwardProp: prop => prop !== '$active' })<{ $active?: boolean }>(({ theme, $active }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'clamp(6px, 0.417vw, 8px)',
  padding: 'clamp(6px, 0.417vw, 8px) clamp(12px, 0.833vw, 16px)',
  border: 'none',
  borderRadius: 50,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'clamp(12px, 0.781vw, 15px)',
  fontWeight: 600,
  lineHeight: 1.6,
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  backgroundColor: $active ? SNOW : 'rgba(255, 255, 255, 0.1)',
  color: $active ? SOFT_BLACK : SNOW,
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: {
    backgroundColor: $active ? SNOW : 'rgba(255, 255, 255, 0.16)'
  },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

// Dark dropdown pill — Figma Filters component: rgba(0,0,0,0.4) fill, 8px
// radius, pl-24 pr-16 py-8, gray-5 16px label (1.75 line), 20px chevron.
const FilterSelect = styled(Select)(() => ({
  height: 'clamp(36px, 2.292vw, 44px)', // py-8 + the 28px (16px × 1.75) label line
  minWidth: 'clamp(120px, 7.813vw, 150px)',
  borderRadius: 8,
  color: GRAY5,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  fontSize: 'clamp(13px, 0.833vw, 16px)',
  fontWeight: 400,
  ['& .MuiSelect-select']: {
    padding: '0 clamp(32px, 2.083vw, 40px) 0 clamp(18px, 1.25vw, 24px)',
    display: 'flex',
    alignItems: 'center'
  },
  ['& .MuiSelect-icon']: {
    color: GRAY5,
    right: 12,
    fontSize: 20
  },
  ['& .MuiOutlinedInput-notchedOutline']: {
    border: 'none'
  }
}))

// ── Mobile filter drawer (right sidebar) ──────────────────────────────────
// Opened by FilterButton; holds the Category + Sort controls that the desktop
// toolbar shows inline. Anchored right per "a filter button that opens the
// right sidebar with the filters".
const FilterDrawer = styled(Drawer)(({ theme }) => ({
  ['& .MuiDrawer-paper']: {
    width: 'min(360px, 85vw)',
    boxSizing: 'border-box',
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    backgroundColor: SOFT_BLACK,
    backgroundImage: 'none',
    color: SNOW
  }
}))

const DrawerHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
})

const DrawerTitle = styled(Typography)({
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.6,
  color: SNOW
})

const DrawerCloseButton = styled(IconButton)({
  color: SNOW,
  padding: 4
})

const DrawerSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}))

const DrawerSectionLabel = styled(Typography)({
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  color: GRAY5
})

// Full-width variant of FilterSelect for use inside the drawer.
const DrawerSelect = styled(FilterSelect)({
  width: '100%',
  minWidth: 0
})

// Active-filter chips under the toolbar on mobile (Figma 2019:82280): white
// pill, soft-black label, trailing ✕ that clears the filter.
const FilterChipsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('md')]: { display: 'none' }
}))

const FilterChip = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  height: 32,
  padding: theme.spacing(0.5, 1.5),
  border: 'none',
  borderRadius: 50,
  backgroundColor: SNOW,
  color: SOFT_BLACK,
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: GRAY5 },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

const ChipCloseIcon = styled(CloseRoundedIcon)({
  fontSize: 16
})

// Section headings ("Live Now", "Featured Places") — typography/h4 from the
// Figma: 32px Inter Medium, 1.235 line, soft-white.
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 'clamp(24px, 1.667vw, 32px)',
  fontWeight: 500,
  lineHeight: 1.235,
  color: SNOW,
  margin: theme.spacing(4, 0, 2),
  [theme.breakpoints.down('sm')]: {
    fontSize: 24,
    textAlign: 'center' // Figma mobile centers the section headings
  }
}))

// Live Now rail — the Figma "Live Now Section" (1850:43355): 32px padding,
// 40px radius, soft white glow, radial purple gradient (#A042CD center →
// #32134C edge). The ellipse radii are decoded from the Figma gradient's
// userSpace matrix (semi-axes 1134px × 524px in the 1789×465 frame → 63.4% of
// the width, 112.7% of the height), so it darkens toward the edges like the
// design instead of reading nearly flat. Percentages track the responsive box
// the way the Figma's `preserveAspectRatio: none` fill stretches to fill it.
const LiveNowSection = styled(Box)(({ theme }) => ({
  padding: 'clamp(20px, 1.667vw, 32px)', // 32px at the Figma's 1920 frame
  borderRadius: 'clamp(28px, 2.083vw, 40px)',
  boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.25)',
  background: 'radial-gradient(63.4% 112.7% at 50% 50%, #A042CD 0%, #8536AD 25%, #692A8D 50%, #4E1F6C 75%, #32134C 100%)',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 24
  }
}))

// Heading row inside the rail: red broadcast icon + "Live Now", 12px gap,
// 32px gap down to the cards.
const LiveHeading = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5), // 12px
  marginBottom: 'clamp(20px, 1.667vw, 32px)', // 32px
  fontSize: 'clamp(24px, 1.667vw, 32px)',
  fontWeight: 500,
  lineHeight: 1.235,
  color: SNOW,
  [theme.breakpoints.down('sm')]: {
    fontSize: 24,
    marginBottom: theme.spacing(2),
    justifyContent: 'center' // Figma mobile centers the "Live Now" heading
  }
}))

// Live Now cards. Desktop: a 2-up / 4-up grid (Figma "one row of 4"). Mobile:
// a swipeable, scroll-snapping carousel (Figma shows one card with the next
// peeking + dot indicators below) instead of a tall vertical stack.
const LiveGrid = styled(Box)(({ theme }) => ({
  position: 'relative', // offsetParent for the carousel active-dot math
  display: 'flex',
  gap: theme.spacing(2),
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollbarWidth: 'none',
  ['&::-webkit-scrollbar']: { display: 'none' },
  // Desktop: flex row like the What's On Live Now rail — with fewer than 4
  // scenes the cards GROW to share the full width (capped so 1-2 cards don't
  // balloon absurdly) instead of leaving a half-empty fixed grid.
  [theme.breakpoints.up('sm')]: {
    gap: theme.spacing(3), // 24px
    scrollSnapType: 'none',
    // Same as What's On's LiveNowGrid: a lone (max-width-capped) card sits
    // centered, and when 4 min-width cards outgrow the viewport the rail
    // stays horizontally scrollable ('safe center' degrades to start).
    // Padding + negative margin keep the hover glow inside the scrollport
    // (What's On's CarouselWrapper does the same).
    justifyContent: 'safe center',
    padding: theme.spacing(3, 2),
    margin: theme.spacing(-3, -2)
  }
}))

// One carousel cell. Mobile: a full-width flex item that snaps, so exactly one
// card is centered at a time (no peeking neighbour). Desktop: a plain grid item
// filling its column.
const CarouselSlide = styled(Box)(({ theme }) => ({
  flex: '0 0 100%',
  minWidth: 0,
  scrollSnapAlign: 'center',
  [theme.breakpoints.up('sm')]: {
    flex: '1 1 0',
    minWidth: SHARED_CARD_TRACK, // never smaller than the 4-up cell
    maxWidth: 850, // What's On's cap — 1-2 live scenes grow, not balloon
    scrollSnapAlign: 'none'
  }
}))

// Dot indicators under the mobile carousel — hidden on desktop (the grid shows
// every card at once).
const CarouselDots = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { display: 'none' }
}))

const CarouselDot = styled('button', { shouldForwardProp: prop => prop !== '$active' })<{ $active?: boolean }>(({ theme, $active }) => ({
  width: 8,
  height: 8,
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  backgroundColor: $active ? SNOW : 'rgba(255, 255, 255, 0.35)',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: $active ? SNOW : 'rgba(255, 255, 255, 0.6)' },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

// Featured rail — 429px horizontal cards. Same responsive column steps as the
// Explore grid so both rails share one density.
// Underlined uppercase link-button under the Featured grid (Figma: "VIEW ALL
// FEATURED PLACES" / "VIEW LESS"), left-aligned.
const FeaturedToggle = styled('button')(({ theme }) => ({
  alignSelf: 'flex-start',
  border: 'none',
  padding: 0,
  marginBottom: theme.spacing(2),
  background: 'none',
  color: dclColors.neutral.softWhite,
  // Figma "VIEW ALL FEATURED PLACES": Inter Semi-Bold 13/24, 0.46px tracking,
  // solid underline at the default offset/thickness. Theme font IS Inter —
  // buttons don't inherit it, so set it explicitly via the token.
  fontFamily: theme.typography.fontFamily,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '24px',
  letterSpacing: '0.46px',
  textTransform: 'uppercase',
  textDecoration: 'underline',
  cursor: 'pointer',
  transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.shortest }),
  ['&:hover']: { opacity: 0.8 },
  ['&:active']: { opacity: 0.6 },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.base.primary}`, outlineOffset: 2 }
}))

// Trailing sentinel under the Explore grid — the IntersectionObserver target
// for infinite scroll, tall enough to host the next-page spinner.
const LoadMoreSentinel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: theme.spacing(8)
}))

// Same track formula What's On uses for its Upcoming grid, because both now
// render the same ui2 card: the card carries a 300px minimum, so fixed column
// counts would overflow it (4-up at 1280 leaves ~290 per column). `auto-fill`
// drops a column instead.
const FeaturedGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: `repeat(auto-fill, minmax(${SHARED_CARD_TRACK}, 1fr))`,
    gap: theme.spacing(3)
  }
}))

export {
  CarouselDot,
  CarouselDots,
  CarouselSlide,
  ChipCloseIcon,
  ControlsRow,
  DesktopFilters,
  DrawerCloseButton,
  DrawerHeader,
  DrawerSection,
  DrawerSectionLabel,
  DrawerSelect,
  DrawerTitle,
  ExploreBand,
  ExploreBandContent,
  ExploreToolbar,
  FeaturedGrid,
  FeaturedToggle,
  FilterButton,
  FilterChip,
  FilterChipsRow,
  FilterDrawer,
  FilterSelect,
  LiveGrid,
  LoadMoreSentinel,
  LiveHeading,
  LiveNowSection,
  SearchSlot,
  SectionTitle,
  TabPill,
  TabsRow,
  ToolbarSearchField
}

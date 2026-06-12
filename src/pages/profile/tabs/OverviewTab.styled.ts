import { Box, Typography, styled } from 'decentraland-ui2'

const OverviewRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingTop: theme.spacing(1),
  position: 'relative'
}))

// Figma 288:27808 — info container that wraps Badges + About + Links.
// Specs: border-radius 16, bg rgba(0,0,0,0.20), padding 30/40, gap 32, column.
// `position: relative` anchors the floating EditProfileButton (Figma "edit CTAS",
// absolute right 14 / top 12 of this card) on the own profile.
const InfoSurface = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 32,
  padding: '30px 40px',
  borderRadius: 16,
  background: 'rgba(0, 0, 0, 0.20)',
  width: '100%',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3, 2),
    gap: theme.spacing(3)
  }
}))

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1.5)
}))

// Figma I322:49174;288:27828 / 288:27824 — section titles (ABOUT, BADGES, EQUIPPED…): Inter SemiBold 16, color #fcfcfc, uppercase, line normal
const SectionTitle = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  color: '#FCFCFC',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 'normal',
  textTransform: 'uppercase'
})

// Figma I322:49174;288:27826 — badges grid: flex row, gap 30.
// Mobile (Figma 167:85490) tightens the gap so four smaller badges fit per row.
const BadgesRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 30,
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    gap: 12
  }
}))

// Figma `Badges` component — 86×86 slot (72×72 on phones, four per row).
const BadgeSlot = styled(Box)(({ theme }) => ({
  width: 86,
  height: 86,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'default',
  outline: 'none',
  [theme.breakpoints.down('sm')]: {
    width: 72,
    height: 72
  }
}))

const BadgeImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block'
})

const BadgeFallback = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: 14
}))

// Figma I322:49174;288:27829 — bio paragraph: Inter Regular 16 #fcfcfc, line normal
const BioText = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  color: '#FCFCFC',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 'normal',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
})

const EmptyBio = styled(Typography)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 1.5,
  color: theme.palette.text.disabled,
  fontStyle: 'italic'
}))

// Figma I322:49174;288:27830 — AdditionalInfo: flex-wrap, gap 16, each cell 200×50 column
const InfoGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'flex-start',
  marginTop: theme.spacing(2)
}))

// Figma I322:49174;288:27831 — AdditionalAttribute cell: 200 wide, gap 4, column
const InfoItem = styled(Box)({
  width: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  justifyContent: 'center'
})

// Figma I322:49174;288:27834 — info label: Inter SemiBold 14, #cfcdd4, uppercase, with 20×20 icon
const InfoLabel = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#CFCDD4',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 'normal',
  textTransform: 'uppercase'
})

// 20×20 slot rendered inline with the label. Inherits color from InfoLabel
// (`#CFCDD4`), so the custom PronounsIcon SVG (stroke="currentColor") matches.
const InfoIcon = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 20,
  height: 20,
  color: '#CFCDD4',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 20 },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& svg': { width: 20, height: 20 }
})

// Figma I322:49174;288:27835 — info value: Inter Regular 16, #fcfcfc, line 1.5
const InfoValue = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  color: '#FCFCFC',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  wordBreak: 'break-word'
})

// Figma I322:49174;288:27884 — pill row, gap 14
const LinksRow = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 14
})

// `#57C2FF` is a Figma-only blue — not present in `dclColors` (closest match
// is `rarity.epic: #438FFF`, intentionally different). Kept hardcoded with
// this comment so a future palette pass can promote it if the design system
// adopts it. Theme font (Inter) is inherited from Typography defaults.
const LinkPill = styled('a')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 10px',
  borderRadius: 12,
  background: 'rgba(0, 0, 0, 0.20)',
  color: '#57C2FF',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 'normal',
  textDecoration: 'none',
  transition: 'background 150ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.30)'
  }
})

// Figma `SocialMediaIcns` — 22×22 cyan icon
const LinkPillIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  color: '#57C2FF',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 22 }
})

const EquippedGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  // auto-fill + 250px floor → 4 cards a partir de ~1050px de ancho de grid,
  // 3/2 a medida que la pantalla se achica. Mantiene los CatalogCards
  // siempre con un piso de 250px sin necesidad de breakpoints manuales.
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  // Figma I322:49174;281:26202 — row-gap 28, column-gap 16
  rowGap: 28,
  columnGap: 16,
  alignItems: 'stretch',
  // Mobile spec keeps two cards per row even when the viewport is too narrow for the
  // 250px floor — the cards shrink instead of collapsing to a single column.
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    rowGap: 16,
    columnGap: 12
  },
  // Grid `1fr` tracks can't shrink below the item's min-content, and the ui2 CatalogCard
  // reports a fixed 288px there — without `minWidth: 0` the 2-col mobile grid overflows
  // the viewport instead of compressing the cards.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > *': {
    minWidth: 0
  },
  // CatalogCard de ui2 trae ancho fijo (theme.spacing(36) ≈ 288px). Forzamos
  // width: 100% al ancho del grid cell; la altura ya es estable en ui2 ≥3.13
  // (el hover redistribuye espacio imagen↔info sin crecer el card).
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiCard-root': {
    width: '100%'
  }
}))

const LoadingRow = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-start',
  padding: '24px 0'
})

const CreationsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  flexWrap: 'wrap'
}))

const CreationsFilters = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap'
}))

const ViewAllLink = styled('a')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  color: '#57C2FF',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    textDecoration: 'underline'
  }
})

// On the user's own profile every equipped item is a navigation target (open
// marketplace in a new tab), so we wrap the CatalogCard in a transparent
// anchor. EditIconButton is the only other display:block target — this one is
// inline so the grid laid-out card sizes correctly.
const EquippedCardLink = styled('a')({
  display: 'block',
  width: '100%',
  textDecoration: 'none',
  color: 'inherit'
})

const EditIconButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 999,
  padding: theme.spacing(0.5, 1.5),
  background: 'rgba(255, 255, 255, 0.04)',
  color: theme.palette.text.secondary,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover:not(:disabled)': {
    color: theme.palette.text.primary,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6
  }
}))

export {
  BadgeFallback,
  BadgeImage,
  BadgeSlot,
  BadgesRow,
  BioText,
  EditIconButton,
  EmptyBio,
  CreationsFilters,
  CreationsHeader,
  EquippedCardLink,
  EquippedGrid,
  ViewAllLink,
  InfoGrid,
  InfoIcon,
  InfoItem,
  InfoLabel,
  InfoSurface,
  InfoValue,
  LinkPill,
  LinkPillIcon,
  LinksRow,
  LoadingRow,
  OverviewRoot,
  SectionHeader,
  SectionTitle
}

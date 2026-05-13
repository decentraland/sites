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
const InfoSurface = styled(Box)(({ theme }) => ({
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

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: 'uppercase'
}))

const BadgesRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  alignItems: 'center'
}))

const BadgeSlot = styled(Box)({
  width: 64,
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'default',
  outline: 'none'
})

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
  fontSize: 14,
  fontFamily: 'Inter, sans-serif'
}))

const BioText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 15,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
}))

const EmptyBio = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontFamily: 'Inter, sans-serif',
  fontStyle: 'italic'
}))

const InfoGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
  gap: theme.spacing(2.5),
  marginTop: theme.spacing(2)
}))

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25)
}))

const InfoLabel = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1
}))

const InfoValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 14
}))

const LinksRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1)
}))

/* eslint-disable @typescript-eslint/naming-convention */
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
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.30)'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const LinkPillIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  color: '#57C2FF'
})

const EquippedGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  // auto-fill + 250px floor → 4 cards a partir de ~1050px de ancho de grid,
  // 3/2/1 a medida que la pantalla se achica. Mantiene los CatalogCards
  // siempre con un piso de 250px sin necesidad de breakpoints manuales.
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: theme.spacing(2),
  alignItems: 'stretch',
  // CatalogCard de ui2 trae ancho fijo (theme.spacing(36) ≈ 288px) y crece en
  // hover. Forzamos width: 100% al ancho del grid cell y bloqueamos el growth
  // de altura en ambos estados.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiCard-root, & .MuiCard-root:hover': {
    width: '100%',
    height: theme.spacing(45)
  },
  // Shrink the wearable thumbnail on hover for other-profile cards so the BUY
  // button doesn't end up overlapping the badge row underneath. Own-profile
  // cards are wrapped in `EquippedCardLink` (an <a>), so the `div >` selector
  // scopes this to the non-own case only.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > div .MuiCard-root:hover .AssetImageContainer': {
    height: theme.spacing(20),
    transition: 'height 0.1s ease-in-out'
  },
  // ui2 only fades the RarityBadgeSlot via `hideRarityOnHover`, but our
  // BadgeRow groups rarity + the new category/body-shape `infoBadges`. Fade
  // the whole row on hover so the BUY button doesn't visually overlap any
  // surviving icons.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > div .MuiCard-root:hover .MuiCardContent-root > div:has([data-role="catalog-card-rarity"])': {
    opacity: 0,
    transition: 'opacity 0.2s ease-in-out'
  },
  // ui2 expands CatalogItemInformationContainer / ExtraInformationContainer on
  // hover to reveal `action` / `extraInformation`. We always pass `null` for
  // those, so the expansion produces empty rows (~34px from an empty <p>) that
  // push the price line into the BUY button. Keep them collapsed on hover.
  // `!important` is required because ui2 ships the hover rule with the same
  // specificity tier (single emotion target class) and the cascade order is
  // not deterministic across HMR — without `!important` the auto-height rule
  // can win when the styled file is hot-reloaded.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > div .MuiCard-root:hover .CatalogItemInformationContainer, & > div .MuiCard-root:hover .ExtraInformationContainer': {
    display: 'none'
  }
}))

const LoadingRow = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-start',
  padding: '24px 0'
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

/* eslint-disable @typescript-eslint/naming-convention */
const EditIconButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 999,
  padding: theme.spacing(0.5, 1.5),
  background: 'rgba(255, 255, 255, 0.04)',
  color: theme.palette.text.secondary,
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: 1,
  '&:hover:not(:disabled)': {
    color: theme.palette.text.primary,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.6
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

export {
  BadgeFallback,
  BadgeImage,
  BadgeSlot,
  BadgesRow,
  BioText,
  EditIconButton,
  EmptyBio,
  EquippedCardLink,
  EquippedGrid,
  InfoGrid,
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

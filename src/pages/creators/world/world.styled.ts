import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const SectionCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.backdrop,
  boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const SectionHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5)
}))

const SectionTitle = styled(Typography)({ fontSize: 20, fontWeight: 700 })

const SoonBadge = styled('span')(({ theme }) => ({
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: theme.spacing(0.25, 1),
  borderRadius: 999,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.primary.main}`
}))

const Helper = styled(Typography)({ fontSize: 13, color: dclColors.neutral.gray3 })

// Centers the loading spinner shared by the section pages (Access/Streaming/
// Events/Admins/Bans) while their data loads.
const SpinnerBox = styled(Box)(({ theme }) => ({ display: 'flex', justifyContent: 'center', margin: theme.spacing(2, 0) }))

// ---- Deployment info (definition-list style) ----
const InfoGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { gridTemplateColumns: '1fr 1fr' }
}))

const InfoItem = styled(Box)(({ theme }) => ({ display: 'flex', flexDirection: 'column', gap: theme.spacing(0.25), minWidth: 0 }))

const InfoKey = styled(Typography)({
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: dclColors.neutral.gray3
})

const InfoValue = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  wordBreak: 'break-word',
  ['& code']: { fontFamily: 'monospace', fontSize: 13 }
})

const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1)
}))

// White-pill primary CTA — the design-system action button on dark surfaces
// (matches CommunityInfo's CTAButton).
const PrimaryButton = styled(Button)(({ theme }) => ({
  height: 44,
  paddingInline: theme.spacing(3),
  backgroundColor: dclColors.neutral.softWhite,
  color: dclColors.neutral.softBlack1,
  borderRadius: theme.spacing(1.5),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  boxShadow: 'none',
  ['&:hover']: { backgroundColor: 'rgba(252, 252, 252, 0.85)', boxShadow: 'none' },
  ['&:active']: { transform: 'scale(0.98)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

// Outlined ghost button for secondary actions on dark surfaces.
const GhostButton = styled(Button)(({ theme }) => ({
  height: 44,
  paddingInline: theme.spacing(2.5),
  color: dclColors.neutral.softWhite,
  border: `1px solid ${dclColors.whiteTransparent.blurry}`,
  borderRadius: theme.spacing(1.5),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  backgroundColor: 'transparent',
  ['&:hover']: { backgroundColor: 'rgba(252, 252, 252, 0.08)', borderColor: dclColors.neutral.softWhite },
  ['&:active']: { transform: 'scale(0.98)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

// ---- Stat tiles ----
const StatTile = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: 'rgba(252, 252, 252, 0.02)',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

const StatValue = styled(Typography)({ fontSize: 24, fontWeight: 700, lineHeight: 1.1 })
const StatLabel = styled(Typography)({ fontSize: 12, color: dclColors.neutral.gray3, textTransform: 'uppercase', letterSpacing: '0.06em' })

// ---- Coming-soon placeholder ----
const ComingSoonHint = styled(Typography)({ fontSize: 14, color: dclColors.neutral.gray3 })

const PlaceholderStrip = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
  opacity: 0.55
}))

export {
  ActionsRow,
  ComingSoonHint,
  GhostButton,
  Helper,
  InfoGrid,
  InfoItem,
  InfoKey,
  InfoValue,
  PlaceholderStrip,
  PrimaryButton,
  SectionCard,
  SectionHeaderRow,
  SectionTitle,
  SoonBadge,
  SpinnerBox,
  StatLabel,
  StatTile,
  StatValue
}

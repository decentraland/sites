import { Box, Button, Checkbox, FormControlLabel, Typography, styled } from 'decentraland-ui2'

// Figma 797:78245 — Delete Account section. Colours mirror the DCL design
// tokens used across the Account area: destructive DCL Red (#FF2D55) and warning amber (#FFA500) stay
// as semantic accents; all body copy is white (#FCFCFC), never muted. Hardcoded hexes follow the
// sibling Account styled files.

// The section is wrapped in the same translucent rounded panel that surrounds the Security section
// (mirrors SecuritySection's Container), and stretches the full width of the account content column
// (no maxWidth) so it matches the other account sections.
const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  background: 'rgba(0, 0, 0, 0.2)',
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3)
  }
}))

const DangerBanner = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  borderRadius: 8,
  backgroundColor: 'rgba(255, 45, 85, 0.1)',
  border: '1px solid rgba(255, 45, 85, 0.3)'
})

const BannerTextWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 2
})

const DangerBannerTitle = styled(Typography)({
  color: '#FF2D55',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: '22px'
})

const DangerBannerDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 13,
  lineHeight: '20px'
})

// The section's outer Container is now the single translucent panel (matching the Security section),
// so this no longer draws its own background — it only groups the "lost forever" copy + list.
const WarningCard = styled(Box)({})

const WarningDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 16,
  lineHeight: '24px'
})

const ConsequencesList = styled('ul')({
  listStyle: 'none',
  padding: 0,
  margin: 0
})

const ConsequenceItem = styled('li')({
  display: 'flex',
  gap: 10,
  marginBottom: 12,
  color: '#FCFCFC',
  fontSize: 14,
  lineHeight: '22px',
  alignItems: 'flex-start',
  ['&:last-child']: {
    marginBottom: 0
  }
})

const ConsequenceIcon = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: 1,
  color: '#A09BA8',
  ['& .MuiSvgIcon-root']: {
    fontSize: 18
  }
})

const ConsequenceText = styled('span')({
  color: '#FCFCFC'
})

const ConsequenceTitle = styled('span')({
  color: '#FCFCFC',
  fontWeight: 600
})

const AssetWarningBox = styled(Box)({
  display: 'flex',
  gap: 12,
  padding: 16,
  borderRadius: 8,
  backgroundColor: 'rgba(255, 165, 0, 0.08)',
  border: '1px solid rgba(255, 165, 0, 0.3)',
  alignItems: 'flex-start'
})

const AssetWarningTextWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4
})

const AssetWarningTitle = styled(Typography)({
  color: '#FFA500',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '20px'
})

const AssetWarningDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 13,
  lineHeight: '20px'
})

const ExportKeyDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 13,
  lineHeight: '20px',
  marginTop: 4
})

// Rendered with variant="outlined" color="inherit" so it picks up the theme's NEUTRAL outlined
// styling — a white (text.primary) label + subtle border that stays white on hover. The default
// (primary) outlined variant turns the label red on hover via a high-specificity theme rule that a
// styled() override can't beat, so we switch the colour scheme instead of fighting it. Only layout
// (spacing + left alignment) is customised here; the rest comes from the theme.
const ExportKeyLink = styled(Button)({
  marginTop: 8,
  alignSelf: 'flex-start'
})

// Confirmation gate above the delete button: the user must tick it to enable deletion.
const AcknowledgeControl = styled(FormControlLabel)({
  alignItems: 'flex-start',
  margin: 0,
  marginTop: 8,
  gap: 8
})

const AcknowledgeCheckbox = styled(Checkbox)({
  padding: 0,
  color: 'rgba(252, 252, 252, 0.6)',
  ['&.Mui-checked']: {
    color: '#FF2D55'
  }
})

const AcknowledgeLabel = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 13,
  lineHeight: '20px',
  // The row is top-aligned (AcknowledgeControl uses alignItems: flex-start) so multi-line copy flows
  // correctly beneath the first line. Nudge the label down 2px so the first line's optical centre
  // lines up with the 24px checkbox instead of sitting slightly above it — (24 - 20) / 2.
  marginTop: 2
})

// Figma 797:78245 — left-aligned destructive action. On mobile it stretches the full width of the
// section (alignSelf: stretch); from md up it shrinks to its natural width, still left-aligned.
const DeleteButton = styled(Button)(({ theme }) => ({
  marginTop: 8,
  alignSelf: 'stretch',
  backgroundColor: '#FF2D55',
  [theme.breakpoints.up('md')]: {
    alignSelf: 'flex-start'
  },
  ['&:hover']: {
    backgroundColor: '#E0264B'
  },
  ['&.Mui-disabled']: {
    backgroundColor: 'rgba(255, 45, 85, 0.4)',
    color: 'rgba(252, 252, 252, 0.6)'
  }
}))

export {
  AcknowledgeCheckbox,
  AcknowledgeControl,
  AcknowledgeLabel,
  AssetWarningBox,
  AssetWarningDescription,
  AssetWarningTextWrapper,
  AssetWarningTitle,
  BannerTextWrapper,
  ConsequenceIcon,
  ConsequenceItem,
  ConsequenceText,
  ConsequenceTitle,
  ConsequencesList,
  Container,
  DangerBanner,
  DangerBannerDescription,
  DangerBannerTitle,
  DeleteButton,
  ExportKeyDescription,
  ExportKeyLink,
  WarningCard,
  WarningDescription
}

import { Box, Typography, styled } from 'decentraland-ui2'

// Mirrors the Account area design tokens: translucent black panel (rgba(0,0,0,0.2)) and text #FCFCFC.
// Body copy is white (never muted); only the amber warning (#FFA500) reused from the Delete section's
// asset warning box stays as a semantic accent. Hardcoded hexes follow the sibling account styled files.

// Stretches the full width of the account content column (no maxWidth) so the panel matches the
// other account sections that fill the available width.
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

const TitleRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const SectionTitle = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 18,
  fontWeight: 700,
  lineHeight: '26px'
})

const Intro = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 14,
  lineHeight: '22px'
})

const ResponsibilityTitle = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '24px'
})

const ResponsibilityDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 14,
  lineHeight: '22px'
})

const WarningBox = styled(Box)({
  display: 'flex',
  gap: 12,
  padding: 16,
  borderRadius: 8,
  backgroundColor: 'rgba(255, 165, 0, 0.08)',
  border: '1px solid rgba(255, 165, 0, 0.3)',
  alignItems: 'flex-start'
})

const WarningTextWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4
})

const WarningTitle = styled(Typography)({
  color: '#FFA500',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '20px'
})

const WarningDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 13,
  lineHeight: '20px'
})

const RevealDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 13,
  lineHeight: '20px'
})

// On mobile the reveal Button stretches the full width of the section (column layout → the flex item
// stretches on the cross axis). On desktop it switches to a row so the Button keeps its natural width,
// left-aligned. The Button itself stays a plain MUI Button rendered as an anchor (component="a"),
// which — unlike styled(Button) — preserves MUI's polymorphic href/target typing.
const RevealActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row'
  }
}))

export {
  Container,
  Intro,
  ResponsibilityDescription,
  ResponsibilityTitle,
  RevealActions,
  RevealDescription,
  SectionTitle,
  TitleRow,
  WarningBox,
  WarningDescription,
  WarningTextWrapper,
  WarningTitle
}

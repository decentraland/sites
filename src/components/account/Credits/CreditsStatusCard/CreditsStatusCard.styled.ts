import { Box, Link, Typography, styled } from 'decentraland-ui2'

const Card = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  // Figma 821:87052 — content sits on the translucent black panel (#00000033 = rgba(0,0,0,0.2)).
  background: 'rgba(0, 0, 0, 0.2)',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2.5),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3)
  }
}))

const Title = styled(Typography)(() => ({
  fontSize: 18,
  fontWeight: 700,
  color: '#FCFCFC'
}))

const StatusLine = styled(Typography)(() => ({
  fontSize: 14,
  color: '#A09BA8'
}))

const StatusValue = styled('span', {
  shouldForwardProp: prop => prop !== 'highlight'
})<{ highlight?: boolean }>(({ highlight }) => ({
  fontWeight: 600,
  // Figma 823:88188 — enrolled status is rendered in the DCL success green; other states fall
  // back to the primary text color.
  color: highlight ? '#34CE77' : '#FCFCFC'
}))

const Description = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: '#CFCDD4',
  marginBottom: theme.spacing(0.5)
}))

const LearnMoreLink = styled(Link)(() => ({
  // Figma 821:87052 — DCL accent red for the "Learn more" link.
  color: '#FF2D55',
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  ['&:hover']: {
    textDecoration: 'underline'
  }
}))

const ActionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(1)
}))

export { ActionRow, Card, Description, LearnMoreLink, StatusLine, StatusValue, Title }

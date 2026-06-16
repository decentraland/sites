import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 522:122213 — a single category row: label on the left, toggle on the right, sitting on
// the rgba(0,0,0,0.2) panel token shared across the account sections.

const Row = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  width: '100%',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  background: 'rgba(0, 0, 0, 0.2)'
}))

const Label = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: 15,
  color: '#FCFCFC'
}))

export { Label, Row }

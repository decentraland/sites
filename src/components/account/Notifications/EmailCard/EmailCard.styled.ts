import { Box, Button, TextField, Typography, styled } from 'decentraland-ui2'

// Figma 522:122213 — Email Notification card. Sits on the same rgba(0,0,0,0.2) panel token as
// the sibling account sections; text #FCFCFC, muted copy #A09BA8, accent #FF2D55.

const Card = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  width: '100%',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  background: 'rgba(0, 0, 0, 0.2)'
}))

const HeadingRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2)
}))

const Heading = styled(Typography)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontWeight: 600,
  fontSize: 18,
  color: '#FCFCFC'
}))

const StatusBadge = styled(Typography, { shouldForwardProp: prop => prop !== '$confirmed' })<{ $confirmed?: boolean }>(
  ({ theme, $confirmed }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: theme.spacing(0.25, 1),
    borderRadius: theme.spacing(2),
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: $confirmed ? '#34CE76' : '#F5A623', // Figma 522:122213 — confirmed green / pending amber
    background: $confirmed ? 'rgba(52, 206, 118, 0.16)' : 'rgba(245, 166, 35, 0.16)'
  })
)

const Description = styled(Typography)(() => ({
  fontSize: 14,
  color: '#A09BA8'
}))

const InputRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  }
}))

const EmailInput = styled(TextField)(() => ({
  flex: 1,
  ['& .MuiOutlinedInput-root']: {
    color: '#FCFCFC',
    background: 'rgba(0, 0, 0, 0.2)'
  },
  ['& .MuiOutlinedInput-input::placeholder']: {
    color: '#A09BA8',
    opacity: 1
  }
}))

const SaveButton = styled(Button)(({ theme }) => ({
  alignSelf: 'stretch',
  minWidth: 120,
  background: '#FF2D55', // Figma 522:122213 — DCL accent magenta
  color: '#FCFCFC',
  ['&:hover']: {
    background: '#E0264A'
  },
  ['&.Mui-disabled']: {
    background: 'rgba(255, 45, 85, 0.4)',
    color: 'rgba(252, 252, 252, 0.6)'
  },
  [theme.breakpoints.up('sm')]: {
    alignSelf: 'flex-start',
    height: 56
  }
}))

export { Card, Description, EmailInput, Heading, HeadingRow, InputRow, SaveButton, StatusBadge }

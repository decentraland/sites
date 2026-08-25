import { Box, Typography, styled } from 'decentraland-ui2'

const ScheduleSubtitle = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: '#FCFCFC',
  letterSpacing: '0.04em'
})

const LiveBadgeWrapper = styled(Box)({
  alignSelf: 'flex-start'
})

const CreatorLocationRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  columnGap: theme.spacing(3),
  rowGap: theme.spacing(0.5),
  // Matches the 16px Figma gap between the creator/location row and the action buttons below.
  // HeroContent itself contributes 8px via its flex gap; this margin adds the remaining 8px.
  marginBottom: theme.spacing(1)
}))

// Clickable location chip — jumps into the event location (coords or world) for both live and
// non-live events. Rendered as a `<button>` so keyboard/focus works; `disabled` keeps the
// unsaved-event preview inert while preserving the same visual chip.
const LocationRow = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  color: '#FCFCFC',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(0.5, 1.25),
  borderRadius: theme.spacing(1),
  border: 'none',
  font: 'inherit',
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiSvgIcon-root': {
    fontSize: 18,
    color: '#FCFCFC'
  },
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:active:not(:disabled)': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  },
  '&:disabled': {
    cursor: 'default'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

// A `<span>` (not Typography's default `<p>`) so it can live inside the clickable `LocationRow`
// button without producing invalid block-in-button nesting.
const LocationText = styled('span')({
  fontSize: 14,
  lineHeight: 1.4,
  color: '#FCFCFC',
  wordBreak: 'break-word'
})

const EditButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginLeft: 'auto',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#FCFCFC',
  border: 'none',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.48px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const ScheduleRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5)
}))

const ScheduleIconButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: '#A09BA8',
  flexShrink: 0,
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    color: '#FCFCFC'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  },
  '& .MuiSvgIcon-root': {
    fontSize: 20
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const ScheduleText = styled(Typography)({
  fontSize: 14,
  lineHeight: 1.5,
  color: '#FCFCFC'
})

const RecurrenceText = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: '#A09BA8',
  marginTop: theme.spacing(0.5)
}))

// URNs are long unbroken tokens; wrap anywhere so the moderation modal never overflows horizontally.
const FeaturedItemText = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  lineHeight: 1.5,
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  color: theme.palette.text.primary
}))

const AdminActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2)
}))

// Full-width Jump In pinned to the bottom of the details content, mirroring the in-world event
// panel. Shown for both live and non-live events so recurrent users can jump straight in.
const BottomJumpInRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginTop: theme.spacing(3)
}))

export {
  AdminActionsRow,
  BottomJumpInRow,
  CreatorLocationRow,
  EditButton,
  FeaturedItemText,
  LiveBadgeWrapper,
  LocationRow,
  LocationText,
  RecurrenceText,
  ScheduleIconButton,
  ScheduleRow,
  ScheduleSubtitle,
  ScheduleText
}

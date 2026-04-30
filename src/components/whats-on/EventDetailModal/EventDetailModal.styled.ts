import { Box, Typography, styled } from 'decentraland-ui2'

const CategoryLabel = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: '#FCFCFC',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
})

const LiveBadgeWrapper = styled(Box)({
  alignSelf: 'flex-start'
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

const AdminActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2)
}))

export { AdminActionsRow, CategoryLabel, EditButton, LiveBadgeWrapper, RecurrenceText, ScheduleIconButton, ScheduleRow, ScheduleText }

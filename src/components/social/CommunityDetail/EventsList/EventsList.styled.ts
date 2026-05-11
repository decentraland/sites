import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const EmptyState = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  gridColumn: '1 / -1',
  justifyContent: 'center',
  padding: theme.spacing(4),
  width: '100%'
}))

const EmptyStateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.subtitle1.fontSize,
  fontWeight: 600,
  lineHeight: '100%',
  textAlign: 'center'
}))

const EventsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  justifyContent: 'start',
  width: '100%',
  [theme.breakpoints.down('xs')]: {
    gridTemplateColumns: 'minmax(0, 1fr)',
    justifyContent: 'center'
  }
}))

const EventsSection = styled(Box)(({ theme }) => ({
  alignItems: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  width: '100%'
}))

const InitialLoader = styled(Box)({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '200px',
  width: '100%'
})

const LoadMoreSentinel = styled(Box)(({ theme }) => ({
  gridColumn: '1 / -1',
  minHeight: theme.spacing(2.5),
  width: '100%'
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: dclColors.neutral.softWhite,
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600,
  lineHeight: 1,
  paddingBottom: theme.spacing(3),
  textTransform: 'uppercase',
  width: '100%'
}))

const SentinelLoader = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(2)
}))

export { EmptyState, EmptyStateText, EventsGrid, EventsSection, InitialLoader, LoadMoreSentinel, SectionTitle, SentinelLoader }

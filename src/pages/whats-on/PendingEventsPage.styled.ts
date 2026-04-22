import { Box, Typography, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(({ theme }) => ({
  background: 'radial-gradient(61.64% 109.58% at 50% 54.49%, #A042CD 0%, #270537 100%)',
  minHeight: '100vh',
  padding: theme.spacing(5, 8),
  paddingTop: theme.spacing(20),
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(5, 4),
    paddingTop: theme.spacing(20)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(5, 3),
    paddingTop: theme.spacing(18)
  },
  [theme.breakpoints.down('sm')]: {
    background: '#1A0A2E',
    padding: theme.spacing(3, 2),
    paddingTop: theme.spacing(18)
  }
}))

const CardGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: theme.typography.h4.fontSize,
  fontWeight: 600,
  marginBottom: theme.spacing(3)
})) as typeof Typography

const SectionSubtitle = styled('span')(({ theme }) => ({
  color: theme.palette.grey[400],
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 400,
  marginLeft: theme.spacing(1)
}))

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6)
}))

const EmptyStateText = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey[300],
  fontStyle: 'italic',
  gridColumn: '1 / -1',
  padding: theme.spacing(3, 0)
}))

export { CardGrid, EmptyStateText, PageContainer, Section, SectionSubtitle, SectionTitle }

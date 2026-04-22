import { Box, styled } from 'decentraland-ui2'

const CardGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
}))

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  paddingTop: theme.spacing(8),
  [theme.breakpoints.up('md')]: {
    paddingTop: theme.spacing(12)
  }
}))

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6)
}))

export { CardGrid, PageContainer, Section }

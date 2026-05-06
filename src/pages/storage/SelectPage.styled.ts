import { Box, Typography, styled } from 'decentraland-ui2'

const SelectPageContainer = styled(Box)(({ theme }) => ({
  paddingTop: 64,
  paddingInline: theme.spacing(2),
  paddingBottom: theme.spacing(6),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    paddingTop: 96,
    paddingInline: theme.spacing(4)
  }
}))

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))'
}))

const EmptyState = styled(Typography)(({ theme }) => ({
  paddingBlock: theme.spacing(6),
  textAlign: 'center',
  color: theme.palette.text.secondary
}))

export { CardsGrid, EmptyState, SelectPageContainer }

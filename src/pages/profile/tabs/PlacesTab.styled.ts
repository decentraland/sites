import { Box, styled } from 'decentraland-ui2'

const PlacesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: theme.spacing(2),
  // Narrow phones can't honour the 260px floor without overflowing — relax it.
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
  }
}))

export { PlacesGrid }

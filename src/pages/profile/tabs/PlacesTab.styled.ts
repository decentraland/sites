import { Box, styled } from 'decentraland-ui2'

const PlacesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: theme.spacing(2)
}))

export { PlacesGrid }

import { Box, Typography, styled } from 'decentraland-ui2'

const ListContainer = styled(Box)({
  position: 'absolute',
  inset: 0,
  width: '100vw',
  minHeight: '100vh',
  padding: 50,
  backgroundColor: '#43404a',
  color: '#fcfcfc',
  overflowY: 'auto'
})

const ListTitle = styled(Typography)({
  color: '#fcfcfc',
  fontSize: 24,
  fontWeight: 600,
  marginBottom: 20
})

const ListGrid = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 0
})

/* eslint-disable @typescript-eslint/naming-convention */
const ListItem = styled(Box)({
  width: 200,
  height: 112.5,
  margin: 10,
  cursor: 'pointer',
  borderRadius: 10,
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

export { ListContainer, ListGrid, ListItem, ListTitle }

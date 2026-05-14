import { Box, styled } from 'decentraland-ui2'

const PhotosGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12.989px',
  [theme.breakpoints.down('lg')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  },
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr'
  }
}))

const PhotoCard = styled('a')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  height: '264.972px',
  padding: '16.885px',
  gap: '12.989px',
  borderRadius: 16,
  background: 'rgba(0, 0, 0, 0.30)',
  textDecoration: 'none',
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'transform 200ms ease, box-shadow 200ms ease, background 200ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'rgba(0, 0, 0, 0.45)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)'
  }
})

const PhotoImage = styled('img')({
  width: '100%',
  height: '100%',
  flex: '1 0 0',
  objectFit: 'cover',
  display: 'block',
  borderRadius: 8
})

export { PhotoCard, PhotoImage, PhotosGrid }

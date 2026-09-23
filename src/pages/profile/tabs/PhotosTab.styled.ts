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
  // Phones render one full-width photo per row (Figma mobile photos 294:52829).
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr'
  }
}))

const PhotoCard = styled('button')({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '264.972px',
  padding: 0,
  border: 'none',
  background: 'transparent',
  borderRadius: 16,
  overflow: 'hidden',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'transform 200ms ease, box-shadow 200ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
})

const PhotoImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

const PrivateBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: '50%',
  color: '#FCFCFC',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  fontSize: 16,
  pointerEvents: 'none'
}))

export { PhotoCard, PhotoImage, PhotosGrid, PrivateBadge }

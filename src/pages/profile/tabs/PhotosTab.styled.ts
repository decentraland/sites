import { Box, styled } from 'decentraland-ui2'

const PhotosGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12.989px',
  [theme.breakpoints.down('lg')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  },
  // Mobile spec keeps two thumbnails per row so the grid stays tight at narrow widths
  // and matches the Figma mobile photos node.
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
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

export { PhotoCard, PhotoImage, PhotosGrid }

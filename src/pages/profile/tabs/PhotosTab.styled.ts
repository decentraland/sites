import { Box, styled } from 'decentraland-ui2'

const PhotosGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: theme.spacing(1.5)
}))

const PhotoCard = styled('a')({
  position: 'relative',
  display: 'block',
  aspectRatio: '4 / 3',
  borderRadius: 12,
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.04)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'transform 200ms ease, box-shadow 200ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)'
  }
})

const PhotoImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

export { PhotoCard, PhotoImage, PhotosGrid }

import { Box, Typography, styled } from 'decentraland-ui2'

const PlacesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: theme.spacing(2)
}))

const PlaceCard = styled('a')({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 12,
  overflow: 'hidden',
  background: 'rgba(0, 0, 0, 0.20)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  color: 'inherit',
  textDecoration: 'none',
  transition: 'background 150ms ease, border-color 150ms ease, transform 150ms ease',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.30)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    transform: 'translateY(-2px)'
  }
})

const PlaceImage = styled(Box)({
  width: '100%',
  aspectRatio: '16 / 10',
  background: 'rgba(255, 255, 255, 0.04)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  flexShrink: 0
})

const PlaceBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  minWidth: 0
}))

const PlaceTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: 16,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const PlaceMeta = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  color: theme.palette.text.secondary,
  fontSize: 13
}))

const PlaceMetaItem = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}))

export { PlaceBody, PlaceCard, PlaceImage, PlaceMeta, PlaceMetaItem, PlaceTitle, PlacesGrid }

import { Box, Dialog, IconButton, Typography, styled } from 'decentraland-ui2'

const PhotoDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 1440,
    width: '100%',
    maxHeight: '92vh',
    margin: 0,
    background: '#161518',
    boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.25)',
    overflow: 'hidden'
  },
  [theme.breakpoints.down('md')]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiDialog-paper': {
      borderRadius: 0,
      maxWidth: '100%',
      maxHeight: '100%',
      height: '100%',
      margin: 0
    }
  }
})) as typeof Dialog

const DialogBody = styled(Box, { shouldForwardProp: prop => prop !== '$metadataVisible' })<{ $metadataVisible: boolean }>(
  ({ theme, $metadataVisible }) => ({
    display: 'grid',
    gridTemplateColumns: $metadataVisible ? '1fr 420px' : '1fr',
    height: 'min(820px, 92vh)',
    transition: 'grid-template-columns 0.35s',
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '1fr',
      gridTemplateRows: $metadataVisible ? '1fr auto' : '1fr',
      height: '100%'
    }
  })
)

const ImagePanel = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#000',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
})

const Photo = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block'
})

const MetadataPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  background: '#43404a',
  color: '#fcfcfc'
}))

const MetadataHeader = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 6
})

const SectionTitle = styled(Typography)({
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.55)'
})

const SceneTitle = styled(Typography)({
  fontSize: 20,
  fontWeight: 600,
  color: '#fff'
})

const DateLine = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: '#fcfcfc'
})

const LocationRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12
})

const LocationLink = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: '#fcfcfc',
  fontSize: 14
})

const JumpInLink = styled('a')(({ theme }) => ({
  padding: theme.spacing(0.75, 2),
  borderRadius: 999,
  background: 'linear-gradient(90deg, #FF2D55 0%, #FFBC5B 100%)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    filter: 'brightness(1.05)'
  }
}))

const PeopleSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12
})

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  left: theme.spacing(1.5),
  zIndex: 10,
  color: '#fff',
  background: 'rgba(0, 0, 0, 0.45)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.65)'
  }
}))

export {
  CloseButton,
  DateLine,
  DialogBody,
  ImagePanel,
  JumpInLink,
  LocationLink,
  LocationRow,
  MetadataHeader,
  MetadataPanel,
  PeopleSection,
  Photo,
  PhotoDialog,
  SceneTitle,
  SectionTitle
}

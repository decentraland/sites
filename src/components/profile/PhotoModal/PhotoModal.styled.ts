import { Box, Dialog, IconButton, Typography, styled } from 'decentraland-ui2'

const PhotoDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.85)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 1280,
    width: '100%',
    maxHeight: '90vh',
    margin: 0,
    background: '#0E0518',
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

const DialogBody = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 360px',
  height: 'min(720px, 90vh)',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
    height: '100%'
  }
}))

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
  background: '#1A0A2E'
}))

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

const InfoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 14
})

const PeopleList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 12
})

const PersonRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12
})

const PersonAvatar = styled('img')({
  width: 36,
  height: 36,
  borderRadius: '50%',
  objectFit: 'cover',
  background: 'rgba(255, 255, 255, 0.1)'
})

const PersonName = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  color: '#fff'
})

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
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
  DialogBody,
  ImagePanel,
  InfoRow,
  MetadataPanel,
  PeopleList,
  PersonAvatar,
  PersonName,
  PersonRow,
  Photo,
  PhotoDialog,
  SceneTitle,
  SectionTitle
}

import { Box, Button, Dialog, IconButton, Typography, styled } from 'decentraland-ui2'

const PlaceMetaIcon = styled(Box)({
  display: 'inline-flex',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 16 }
})

const PlaceDetailCloseButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary,
  marginLeft: 'auto'
}))

const PlaceDetailDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 720,
    width: '100%',
    maxHeight: '90vh',
    margin: 0,
    overflowY: 'auto',
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    boxShadow: '0px 4px 25px 0px #FFFFFF40',
    color: theme.palette.common.white,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4)
    }
  }
})) as typeof Dialog

const PlaceDetailRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(3)
}))

const PlaceDetailHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const PlaceDetailIconButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary
}))

const PlaceCoverImage = styled(Box)(({ theme }) => ({
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: theme.spacing(1.5),
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

const PlaceDetailBody = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const PlaceDetailTitle = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 28,
  lineHeight: 1.21,
  color: '#FCFCFC'
})

const PlaceDetailMetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  color: '#A09BA8'
}))

const PlaceDetailMetaItem = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontFamily: '"Inter", sans-serif',
  fontSize: 14,
  fontWeight: 500
}))

const PlaceDetailDescription = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  color: '#FCFCFC',
  whiteSpace: 'pre-wrap'
})

const PlaceJumpButton = styled(Button)({
  alignSelf: 'flex-start',
  minWidth: 180,
  height: 40,
  borderRadius: 10,
  padding: '9px 35px',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: '0.4px',
  lineHeight: '24px',
  textTransform: 'uppercase'
}) as typeof Button

export {
  PlaceCoverImage,
  PlaceDetailBody,
  PlaceDetailCloseButton,
  PlaceDetailDescription,
  PlaceDetailDialog,
  PlaceDetailHeader,
  PlaceDetailIconButton,
  PlaceDetailMetaItem,
  PlaceDetailMetaRow,
  PlaceDetailRoot,
  PlaceDetailTitle,
  PlaceJumpButton,
  PlaceMetaIcon
}

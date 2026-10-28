import { Box, Dialog, IconButton, styled } from 'decentraland-ui2'

const CommunityDialog = styled(Dialog)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 1240,
    width: '100%',
    maxHeight: '90vh',
    margin: 0,
    overflowY: 'auto',
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    boxShadow: '0px 4px 25px 0px #FFFFFF40',
    color: theme.palette.common.white,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      paddingLeft: '27px',
      paddingRight: '27px',
      paddingTop: '30px',
      paddingBottom: '30px'
    }
  }
})) as typeof Dialog

const CommunitySurfaceRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(3)
}))

const CommunityHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const CommunityHeaderIconButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary
}))

const CommunityCloseButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  color: theme.palette.text.primary,
  marginLeft: 'auto'
}))

const CommunityStateBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(6),
  color: theme.palette.text.primary
}))

export { CommunityCloseButton, CommunityDialog, CommunityHeaderIconButton, CommunityHeaderRow, CommunityStateBox, CommunitySurfaceRoot }

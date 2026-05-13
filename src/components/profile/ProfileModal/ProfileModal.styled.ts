import { Dialog, styled } from 'decentraland-ui2'

/* eslint-disable @typescript-eslint/naming-convention */
const ProfileDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: 'transparent',
    boxShadow: 'none',
    overflow: 'visible',
    width: '100%',
    maxWidth: 1650,
    height: '100%',
    maxHeight: 'min(930px, 90vh)',
    margin: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      margin: 0,
      maxHeight: '100vh',
      borderRadius: 0
    }
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(10, 6, 20, 0.7)',
    backdropFilter: 'blur(8px)'
  }
})) as typeof Dialog
/* eslint-enable @typescript-eslint/naming-convention */

export { ProfileDialog }

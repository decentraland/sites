import { CircularProgress, Dialog, IconButton, dclColors, styled } from 'decentraland-ui2'

const PendingDialog = styled(Dialog)(() => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  '& .MuiDialog-paper': {
    background: 'transparent',
    boxShadow: 'none',
    overflow: 'visible'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const PendingSpinner = styled(CircularProgress)(() => ({
  color: dclColors.neutral.white
}))

const PendingCloseButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: dclColors.neutral.white
}))

export { PendingCloseButton, PendingDialog, PendingSpinner }

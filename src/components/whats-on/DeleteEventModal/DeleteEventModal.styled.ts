import { Button, Dialog, DialogActions, Typography, dclColors, styled } from 'decentraland-ui2'

const DELETE_MODAL_BACKGROUND = '#2E1041'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiDialog-paper': {
    backgroundColor: DELETE_MODAL_BACKGROUND,
    borderRadius: theme.spacing(3),
    color: dclColors.neutral.softWhite,
    maxWidth: 540,
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(4)
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const Title = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 24,
  fontWeight: 500,
  lineHeight: 1.334,
  textAlign: 'center',
  color: dclColors.neutral.softWhite
})

const Subtitle = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  textAlign: 'center',
  color: dclColors.neutral.softWhite
})

// Light cancel button per the design: soft-white surface with dark text,
// in contrast with the red destructive confirm.
const CancelActionButton = styled(Button)({
  backgroundColor: dclColors.neutral.softWhite,
  color: dclColors.neutral.softBlack1,
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: dclColors.neutral.gray5
  },
  '&.Mui-disabled': {
    backgroundColor: dclColors.neutral.gray4,
    color: dclColors.neutral.gray1
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: 0,
  display: 'flex',
  gap: theme.spacing(3),
  /* eslint-disable @typescript-eslint/naming-convention */
  '& > *': { flex: 1 }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

export { CancelActionButton, StyledDialog, StyledDialogActions, Subtitle, Title }

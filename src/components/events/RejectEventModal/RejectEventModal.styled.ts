import { Box, Dialog, DialogActions, DialogContent, TextField, Typography, dclColors, styled } from 'decentraland-ui2'

const ADMIN_MODAL_BACKGROUND = '#2E1041'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiDialog-paper': {
    backgroundColor: ADMIN_MODAL_BACKGROUND,
    borderRadius: theme.spacing(3),
    color: dclColors.neutral.softWhite,
    maxWidth: 682,
    width: '100%',
    padding: theme.spacing(3),
    gap: theme.spacing(4)
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const Title = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 24,
  fontWeight: 500,
  lineHeight: 1.334,
  color: dclColors.neutral.softWhite
})

const StyledDialogContent = styled(DialogContent)({
  padding: 0
})

const ReasonsList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: '100%'
})

const ReasonRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 16px'
})

const ReasonLabel = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: '0.15px',
  color: dclColors.neutral.softWhite,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& strong': {
    fontWeight: 600
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const NotesField = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(4)
}))

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: 0,
  marginTop: theme.spacing(4),
  display: 'flex',
  gap: theme.spacing(3),
  /* eslint-disable @typescript-eslint/naming-convention */
  '& > *': { flex: 1 }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 400
}))

export { ErrorText, NotesField, ReasonLabel, ReasonRow, ReasonsList, StyledDialog, StyledDialogActions, StyledDialogContent, Title }

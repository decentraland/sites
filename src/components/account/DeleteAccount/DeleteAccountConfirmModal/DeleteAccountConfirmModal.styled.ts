import { Box, Button, Dialog, DialogContent, IconButton, TextField, Typography, styled } from 'decentraland-ui2'

// Figma 785:74032 — Delete Account confirmation modal. The Paper uses the DCL violet gradient
// (matching the Account area surfaces); the warning circle + destructive button are DCL Red
// (#FF2D55). Text #FCFCFC, description muted #CFCDD4. Hardcoded hexes follow the sibling
// Account / whats-on modal styled files.

const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiDialog-paper': {
    background: 'linear-gradient(180deg, #3B1A52 0%, #2A0E3D 100%)',
    borderRadius: theme.spacing(3),
    color: '#FCFCFC',
    maxWidth: 520,
    width: '100%',
    padding: theme.spacing(4),
    position: 'relative'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CloseIconButton = styled(IconButton)({
  position: 'absolute',
  top: 12,
  right: 12,
  padding: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.09)',
  color: '#FCFCFC',
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.19)'
  }
})

const StyledDialogContent = styled(DialogContent)({
  padding: 0,
  display: 'flex',
  flexDirection: 'column'
})

const WarningIconContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 16
})

const WarningIconCircle = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 64,
  height: 64,
  borderRadius: '50%',
  backgroundColor: '#FF2D55'
})

const WarningTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '28px',
  textAlign: 'center',
  marginBottom: 16,
  color: '#FCFCFC'
})

const ModalDescription = styled(Typography)({
  fontSize: 15,
  lineHeight: '24px',
  color: '#CFCDD4',
  textAlign: 'left',
  marginBottom: 24
})

const ConfirmationInput = styled(TextField)({
  width: '100%',
  marginBottom: 20,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.19)'
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.31)'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const ErrorMessage = styled(Box)({
  backgroundColor: 'rgba(255, 45, 85, 0.1)',
  border: '1px solid #FF2D55',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  color: '#FF2D55',
  fontSize: 14,
  textAlign: 'center'
})

const ButtonContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  gap: 12
})

const CancelButton = styled(Button)({
  flex: 1
})

const ConfirmDeleteButton = styled(Button)({
  flex: 1,
  backgroundColor: '#FF2D55',
  ['&:hover']: {
    backgroundColor: '#E0264B'
  },
  ['&.Mui-disabled']: {
    backgroundColor: 'rgba(255, 45, 85, 0.4)',
    color: 'rgba(252, 252, 252, 0.6)'
  }
})

export {
  ButtonContainer,
  CancelButton,
  CloseIconButton,
  ConfirmDeleteButton,
  ConfirmationInput,
  ErrorMessage,
  ModalDescription,
  StyledDialog,
  StyledDialogContent,
  WarningIconCircle,
  WarningIconContainer,
  WarningTitle
}

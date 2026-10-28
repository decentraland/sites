import { Box, Dialog, IconButton, Typography, styled } from 'decentraland-ui2'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  ['& .MuiBackdrop-root']: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  ['& .MuiDialog-paper']: {
    borderRadius: theme.spacing(2),
    // Figma 823:88188 — same purple radial used by the Receive modal so the account
    // surfaces stay visually consistent.
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    padding: theme.spacing(3),
    maxWidth: 420,
    width: '100%'
  }
}))

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2)
}))

const Title = styled(Typography)(() => ({
  fontWeight: 600,
  color: '#FCFCFC'
}))

const CloseButton = styled(IconButton)(() => ({
  color: '#FCFCFC'
}))

const Description = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  color: '#CFCDD4',
  marginBottom: theme.spacing(2)
}))

const ErrorText = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  // Figma 823:88188 — DCL accent red for inline error copy.
  color: '#FF2D55',
  marginBottom: theme.spacing(2)
}))

const Actions = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing(1.5)
}))

export { Actions, CloseButton, Description, ErrorText, Header, StyledDialog, Title }

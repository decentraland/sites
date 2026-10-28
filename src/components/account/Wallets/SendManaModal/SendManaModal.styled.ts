import { Box, Dialog, IconButton, Typography, styled } from 'decentraland-ui2'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  ['& .MuiBackdrop-root']: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  ['& .MuiDialog-paper']: {
    borderRadius: theme.spacing(2),
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    padding: theme.spacing(3),
    maxWidth: 440,
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

const Body = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const Centered = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(3, 0),
  textAlign: 'center',
  color: '#CFCDD4'
}))

const Description = styled(Typography)(() => ({
  fontSize: 14,
  color: '#CFCDD4'
}))

const StateText = styled(Typography, { shouldForwardProp: prop => prop !== '$error' })<{ $error?: boolean }>(({ $error }) => ({
  fontSize: 14,
  color: $error ? '#FF2D55' : '#CFCDD4'
}))

const ConnectList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}))

export { Body, Centered, CloseButton, ConnectList, Description, Header, StateText, StyledDialog, Title }

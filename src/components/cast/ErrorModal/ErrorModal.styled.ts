import { Button, Typography, styled } from 'decentraland-ui2'

const Overlay = styled('div')(() => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(247deg, #210A35 0%, #000 50%, #210A35 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 16
}))

const Modal = styled('div')(({ theme }) => ({
  backgroundColor: '#3E3A4F',
  borderRadius: 16,
  padding: 48,
  width: 560,
  height: 360,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  [theme.breakpoints.down('sm')]: {
    padding: 32,
    width: '100%',
    height: 'auto'
  }
}))

const Title = styled(Typography)(({ theme }) => ({
  color: 'white',
  fontWeight: 600,
  textAlign: 'center',
  fontSize: 24,
  [theme.breakpoints.down('sm')]: {
    fontSize: 20
  }
}))

const Message = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.8)',
  textAlign: 'center',
  fontSize: 16,
  lineHeight: 1.5,
  [theme.breakpoints.down('sm')]: {
    fontSize: 14
  }
}))

const ExitButton = styled(Button)(({ theme }) => ({
  minWidth: 160,
  padding: '12px 32px',
  fontSize: 16,
  fontWeight: 600,
  textTransform: 'uppercase',
  [theme.breakpoints.down('sm')]: {
    minWidth: 140,
    padding: '10px 24px',
    fontSize: 14
  }
}))

export { ExitButton, Message, Modal, Overlay, Title }

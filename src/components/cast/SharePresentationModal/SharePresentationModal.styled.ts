/* eslint-disable @typescript-eslint/naming-convention */
import { Button, styled } from 'decentraland-ui2'

const Overlay = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
})

const Modal = styled('div')(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: 12,
  padding: '32px 40px',
  width: 480,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100% - 32px)',
    padding: '24px 20px'
  }
}))

const CloseButton = styled('button')({
  position: 'absolute',
  top: 16,
  right: 16,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  '&:hover': {
    color: '#333'
  },
  '& svg': {
    fontSize: 24
  }
})

const Title = styled('h2')({
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  color: '#16141a'
})

const UrlRow = styled('div')({
  display: 'flex',
  width: '100%',
  gap: 8,
  alignItems: 'center'
})

const UrlInput = styled('input')(({ theme }) => ({
  flex: 1,
  padding: '10px 14px',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  color: '#16141a',
  '&::placeholder': {
    color: '#999'
  },
  '&:focus': {
    borderColor: theme.palette.primary.main
  }
}))

const ShareButton = styled(Button)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  fontSize: 14,
  textTransform: 'uppercase',
  padding: '10px 20px',
  minWidth: 'unset',
  borderRadius: 6,
  '&:hover': {
    background: theme.palette.primary.dark
  }
}))

const Divider = styled('div')({
  color: '#999',
  fontSize: 14,
  textAlign: 'center'
})

const BrowseButton = styled(Button)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  fontSize: 14,
  textTransform: 'uppercase',
  padding: '10px 24px',
  borderRadius: 6,
  '&:hover': {
    background: theme.palette.primary.dark
  }
}))

const SupportedFormats = styled('div')({
  color: '#999',
  fontSize: 12,
  textAlign: 'center'
})

const ErrorText = styled('div')(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: 12,
  width: '100%',
  textAlign: 'left',
  marginTop: -12
}))

export { Overlay, Modal, CloseButton, Title, UrlRow, UrlInput, ShareButton, Divider, BrowseButton, SupportedFormats, ErrorText }

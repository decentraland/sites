/* eslint-disable @typescript-eslint/naming-convention */
import { Box, Button, styled } from 'decentraland-ui2'

const ShareLinkContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '16px 24px 32px 24px',
  background: 'linear-gradient(100.12deg, #130119 0%, #320524 100%)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  zIndex: 1000,
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'block'
  }
}))

const StyledShareButton = styled(Button)({
  backgroundColor: '#FF2D55',
  color: '#ffffff',
  borderRadius: 12,
  height: 56,
  fontSize: 16,
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 16px rgba(255, 45, 85, 0.3)',
  border: 'none',
  '&:hover': {
    backgroundColor: '#E02347',
    boxShadow: '0 6px 20px rgba(255, 45, 85, 0.4)'
  },
  '&:focus': {
    backgroundColor: '#E02347',
    outline: '2px solid #ffffff',
    outlineOffset: 2
  },
  '&:active': {
    backgroundColor: '#C01E3F',
    transform: 'translateY(1px)'
  },
  '& .MuiButton-startIcon': {
    marginRight: 8,
    '& svg': { fontSize: 20 }
  }
})

export { ShareLinkContainer, StyledShareButton }

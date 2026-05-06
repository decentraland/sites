import { Button, styled } from 'decentraland-ui2'

const NotFoundContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #d80029 0%, #16213e 50%, #0d1117 100%)',
  color: 'white',
  textAlign: 'center',
  padding: '2rem'
})

const NotFoundIcon = styled('div')({
  fontSize: 64,
  marginBottom: '2rem',
  opacity: 0.6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    fontSize: 64
  }
})

const NotFoundTitle = styled('h1')({
  fontSize: '3rem',
  fontWeight: 'bold',
  margin: '0 0 1rem 0',
  color: 'white'
})

const NotFoundDescription = styled('p')({
  fontSize: '1.2rem',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '2rem',
  maxWidth: 600,
  lineHeight: 1.6
})

const NotFoundButton = styled(Button)(({ theme }) => ({
  background: `${theme.palette.primary.main}`,
  borderColor: `${theme.palette.primary.main}`,
  color: `${theme.palette.primary.contrastText}`,
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  minWidth: 200,
  '&:hover': {
    background: `${theme.palette.primary.dark}`,
    borderColor: `${theme.palette.primary.dark}`,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(255, 45, 85, 0.3)'
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}))

const NotFoundLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 24px',
  background: theme.palette.secondary.main,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  fontSize: '1rem',
  fontWeight: 600,
  minWidth: 200,
  borderRadius: 8,
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    background: theme.palette.secondary.dark,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    textDecoration: 'none',
    color: theme.palette.text.primary
  },
  '&:active': {
    transform: 'translateY(0)'
  }
}))

const ButtonWrapper = styled('div')({
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  justifyContent: 'center'
})

export { ButtonWrapper, NotFoundButton, NotFoundContainer, NotFoundDescription, NotFoundIcon, NotFoundLink, NotFoundTitle }

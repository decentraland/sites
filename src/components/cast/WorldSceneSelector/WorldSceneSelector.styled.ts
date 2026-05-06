import { Typography, styled } from 'decentraland-ui2'

const WorldName = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  color: '#666',
  textAlign: 'center',
  marginTop: -theme.spacing(2)
}))

const SceneSelect = styled('select')(({ theme }) => ({
  width: '100%',
  maxWidth: '400px',
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  borderRadius: theme.spacing(1),
  border: '1px solid #e0e0e0',
  backgroundColor: 'white',
  fontSize: '14px',
  color: '#1a1a1a',
  fontFamily: 'inherit',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${theme.spacing(2)} center`,
  paddingRight: theme.spacing(5),
  transition: 'border-color 0.2s ease',
  '&:hover': {
    borderColor: '#999'
  },
  '&:focus': {
    outline: 'none',
    borderColor: '#FF2D55',
    boxShadow: '0 0 0 2px rgba(255, 45, 85, 0.1)'
  }
}))

export { SceneSelect, WorldName }

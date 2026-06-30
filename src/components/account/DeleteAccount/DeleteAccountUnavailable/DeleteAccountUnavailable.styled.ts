import { Box, Typography, styled } from 'decentraland-ui2'

const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  background: '#00000033'
}))

const TextWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

const Title = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 700,
  color: '#FCFCFC'
}))

const Description = styled(Typography)(() => ({
  fontSize: 14,
  color: '#CFCDD4'
}))

export { Container, Description, TextWrapper, Title }

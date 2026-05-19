import { Box, Typography, styled } from 'decentraland-ui2'

const TabsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: '100%'
}))

const Tab = styled(Box, {
  shouldForwardProp: prop => prop !== 'active'
})<{ active: boolean }>(({ active, theme }) => ({
  display: 'flex',
  alignItems: 'center',
  height: '46px',
  cursor: 'pointer',
  borderBottom: active ? `4px solid ${theme.palette.primary.main}` : 'none',
  paddingBottom: active ? 0 : theme.spacing(0.5),
  transition: theme.transitions.create('border-bottom')
}))

const TabButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(0, 1.25)
}))

const TabText = styled(Typography, {
  shouldForwardProp: prop => prop !== 'active'
})<{ active: boolean }>(({ active, theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: active ? theme.palette.common.white : theme.palette.text.secondary,
  fontFamily: theme.typography.fontFamily
}))

export { Tab, TabButton, TabText, TabsContainer }

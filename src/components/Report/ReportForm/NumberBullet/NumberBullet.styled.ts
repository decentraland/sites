import { Box, styled } from 'decentraland-ui2'

const BulletCircle = styled(Box)(({ theme }) => ({
  width: 18,
  height: 18,
  borderRadius: '50%',
  backgroundColor: theme.palette.common.white,
  color: theme.palette.background.default,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '24px',
  flexShrink: 0
}))

export { BulletCircle }

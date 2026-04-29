import { Box, styled } from 'decentraland-ui2'

const PaginationDots = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(0.75),
  marginTop: theme.spacing(2)
}))

const PaginationDot = styled('button')<{ active: boolean }>(({ theme, active }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  backgroundColor: active ? theme.palette.common.white : 'rgba(255, 255, 255, 0.3)',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  })
}))

export { PaginationDot, PaginationDots }

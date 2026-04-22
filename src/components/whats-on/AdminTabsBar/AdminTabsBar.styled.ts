import { Box, styled } from 'decentraland-ui2'

const Bar = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backdropFilter: 'saturate(180%) blur(20px)',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 3),
  position: 'sticky',
  top: theme.spacing(8),
  zIndex: theme.zIndex.appBar - 1,
  [theme.breakpoints.up('md')]: {
    top: theme.spacing(11.5)
  }
}))

export { Bar }

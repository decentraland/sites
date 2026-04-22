import { Box, Tab, Tabs, styled } from 'decentraland-ui2'

const Bar = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backdropFilter: 'saturate(180%) blur(20px)',
  backgroundColor: 'rgba(39, 5, 55, 0.6)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  justifyContent: 'space-between',
  minHeight: 56,
  padding: theme.spacing(0, 4),
  position: 'sticky',
  top: theme.spacing(8),
  zIndex: theme.zIndex.appBar - 1,
  [theme.breakpoints.up('md')]: {
    minHeight: 64,
    padding: theme.spacing(0, 8),
    top: theme.spacing(11.5)
  }
}))

const BarTabs = styled(Tabs)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  minHeight: 56,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 64
  }
}))

const BarTab = styled(Tab)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 600,
  letterSpacing: '0.5px',
  minHeight: 56,
  padding: theme.spacing(2, 3),
  textTransform: 'uppercase',
  '&.Mui-selected': {
    color: theme.palette.common.white,
    fontWeight: 700
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 64,
    padding: theme.spacing(2, 4)
  }
}))

export { Bar, BarTab, BarTabs }

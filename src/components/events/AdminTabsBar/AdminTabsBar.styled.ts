import { Box, Tab, Tabs, styled } from 'decentraland-ui2'

const Bar = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backdropFilter: 'saturate(180%) blur(20px)',
  backgroundColor: 'rgba(39, 5, 55, 0.6)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  minHeight: 56,
  overflow: 'hidden',
  padding: theme.spacing(0, 2),
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
  flex: 1,
  minHeight: 56,
  minWidth: 0,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3
  },
  [theme.breakpoints.up('md')]: {
    flex: 'none',
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
  minWidth: 'auto',
  padding: theme.spacing(2, 1.5),
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  '&.Mui-selected': {
    color: theme.palette.common.white,
    fontWeight: 700
  },
  [theme.breakpoints.up('md')]: {
    minHeight: 64,
    padding: theme.spacing(2, 4)
  }
}))

const CreateEventButtonWrapper = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    '& .MuiButton-root': {
      fontSize: theme.typography.caption.fontSize,
      minWidth: 'auto',
      padding: theme.spacing(1, 1.5),
      whiteSpace: 'nowrap'
    }
  }
}))

export { Bar, BarTab, BarTabs, CreateEventButtonWrapper }

import { Tab, Tabs, styled } from 'decentraland-ui2'

/* eslint-disable @typescript-eslint/naming-convention */
const StyledTabs = styled(Tabs)(({ theme }) => ({
  width: '100%',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  minHeight: 46,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3
  },
  '& .MuiTabs-flexContainer': {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    gap: theme.spacing(1)
  },
  [theme.breakpoints.up('md')]: {
    '& .MuiTabs-flexContainer': {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4)
    }
  }
})) as typeof Tabs

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 500,
  fontSize: 14,
  textTransform: 'none',
  letterSpacing: 0,
  minHeight: 46,
  padding: theme.spacing(1.5, 1),
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.text.primary
  }
})) as typeof Tab
/* eslint-enable @typescript-eslint/naming-convention */

export { StyledTab, StyledTabs }

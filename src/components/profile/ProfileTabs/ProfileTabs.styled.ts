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
  // Mobile uses the side drawer (ProfileMobileMenu) — hide the horizontal nav so users
  // navigate via the hamburger instead.
  [theme.breakpoints.down('md')]: {
    display: 'none'
  },
  [theme.breakpoints.up('md')]: {
    '& .MuiTabs-flexContainer': {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4)
    }
  }
})) as typeof Tabs

const StyledTab = styled(Tab)(({ theme }) => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 16,
  textTransform: 'uppercase',
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

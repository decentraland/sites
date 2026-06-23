import { Tab, Tabs, styled } from 'decentraland-ui2'

// Figma I322:49174;288:30430 — tabs container: full width, bottom border 1px rgba(255,255,255,0.3),
// gap 50 between tabs, indicator 4px solid #ff2d55 hugging tab width.
/* eslint-disable @typescript-eslint/naming-convention */
const StyledTabs = styled(Tabs)(({ theme }) => ({
  width: '100%',
  borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
  minHeight: 46,
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 4
  },
  '& .MuiTabs-flexContainer': {
    gap: 50
  },
  // Mobile uses the side drawer (ProfileMobileMenu) — hide the horizontal nav so users
  // navigate via the hamburger instead.
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
})) as typeof Tabs

// Figma I322:49174;288:30430;260:65557 — tab: auto width, height 46, Inter SemiBold 16 uppercase,
// idle #a09ba8, active #fcfcfc, no padding (gap drives spacing).
const StyledTab = styled(Tab)(() => ({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 16,
  textTransform: 'uppercase',
  letterSpacing: 0,
  minHeight: 46,
  minWidth: 0,
  padding: 0,
  color: '#A09BA8',
  '&.Mui-selected': {
    color: '#FCFCFC'
  }
})) as typeof Tab
/* eslint-enable @typescript-eslint/naming-convention */

export { StyledTab, StyledTabs }

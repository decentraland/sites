import { Box, dclColors, styled } from 'decentraland-ui2'

// Heavy-tier landing surfaces in sites/ share the radial purple gradient (see
// CommunityDetailPage.styled, CreateEventPage.styled). Keep this one matching
// so the new /social/* tabs feel native, not a port of decentraland.social.
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: 64,
  background: 'radial-gradient(103.89% 95.21% at 95.21% 9.85%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
  [theme.breakpoints.up('md')]: { paddingTop: 96 }
}))

// Sticky tab nav directly under the fixed site navbar.
const NavBar = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 64,
  zIndex: 3,
  display: 'flex',
  alignItems: 'stretch',
  borderBottom: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.blurry,
  backdropFilter: 'blur(12px)',
  padding: theme.spacing(0, 2),
  minHeight: 48,
  [theme.breakpoints.up('md')]: {
    top: 96,
    padding: theme.spacing(0, 4),
    minHeight: 52
  }
}))

const NavList = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  gap: theme.spacing(0.5),
  flex: 1,
  overflowX: 'auto',
  ['&::-webkit-scrollbar']: { display: 'none' }
}))

// Plain styled button rather than MUI <Tab/> — MUI Tabs hijack their
// children's onClick to manage selection, which prevented clicking the
// already-selected LIVE tab from navigating back. Native button = honest
// click handling.
interface NavButtonProps {
  $active?: boolean
}

const NavButton = styled('button', { shouldForwardProp: prop => prop !== '$active' })<NavButtonProps>(({ theme, $active }) => ({
  position: 'relative',
  appearance: 'none',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: '0.1em',
  fontSize: 12,
  padding: theme.spacing(0, 2),
  color: $active ? dclColors.neutral.softWhite : dclColors.neutral.gray3,
  transition: 'color 150ms ease',
  ['&:hover']: { color: dclColors.neutral.softWhite },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: -2
  },
  // 3px brand-color underline indicator when active.
  ['&::after']: {
    content: '""',
    position: 'absolute',
    left: theme.spacing(1.5),
    right: theme.spacing(1.5),
    bottom: 0,
    height: 3,
    borderRadius: '3px 3px 0 0',
    backgroundColor: $active ? theme.palette.primary.main : 'transparent',
    transition: 'background-color 150ms ease'
  }
}))

export { NavBar, NavButton, NavList, PageContainer }

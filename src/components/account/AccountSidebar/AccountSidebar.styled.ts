import { Link } from 'react-router-dom'
import { Box, Typography, styled } from 'decentraland-ui2'

const Sidebar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  width: '100%',
  gap: theme.spacing(0.5),
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    position: 'sticky',
    top: 96,
    width: 280,
    padding: theme.spacing(2)
  }
}))

const UserHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    alignItems: 'flex-start',
    textAlign: 'left'
  }
}))

const Avatar = styled(Box)(() => ({
  position: 'relative',
  width: 56,
  height: 56,
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0
}))

const AvatarImage = styled('img')(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}))

const UserName = styled(Typography)(() => ({
  fontWeight: 600,
  fontSize: 16,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}))

const UserAddress = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  color: theme.palette.text.secondary
}))

const SectionLabel = styled(Typography)(({ theme }) => ({
  display: 'none',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: theme.palette.text.secondary,
  padding: theme.spacing(1, 1.5, 0.5),
  [theme.breakpoints.up('md')]: {
    display: 'block'
  }
}))

const Nav = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  overflowX: 'auto',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'column',
    overflowX: 'visible'
  }
}))

// Theme-independent base shared by the three nav controls. Theme-dependent rules (spacing,
// palette, pseudo-states) are applied inline in each styled definition to keep them typed
// against the styled callback's own theme.
const navItemStaticStyles = {
  display: 'flex',
  alignItems: 'center',
  whiteSpace: 'nowrap' as const,
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  transition: 'background 0.2s ease, color 0.2s ease'
}

const NavItem = styled(Link, { shouldForwardProp: prop => prop !== '$active' })<{ $active?: boolean }>(({ theme, $active }) => ({
  ...navItemStaticStyles,
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  background: $active ? theme.palette.primary.main : 'transparent',
  color: $active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  ['&:hover']: {
    background: $active ? theme.palette.primary.main : theme.palette.action.hover
  },
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const DeleteNavItem = styled(Link, { shouldForwardProp: prop => prop !== '$active' })<{ $active?: boolean }>(({ theme, $active }) => ({
  ...navItemStaticStyles,
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  background: $active ? theme.palette.error.main : 'transparent',
  color: $active ? theme.palette.error.contrastText : theme.palette.error.main,
  ['&:hover']: {
    background: $active ? theme.palette.error.main : theme.palette.action.hover
  },
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.error.main}`,
    outlineOffset: 2
  }
}))

const LogoutButton = styled('button')(({ theme }) => ({
  ...navItemStaticStyles,
  width: '100%',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  background: 'transparent',
  color: theme.palette.text.primary,
  textAlign: 'left',
  ['&:hover']: {
    background: theme.palette.action.hover
  },
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const BottomGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'column',
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`
  }
}))

export {
  Avatar,
  AvatarImage,
  BottomGroup,
  DeleteNavItem,
  LogoutButton,
  Nav,
  NavItem,
  SectionLabel,
  Sidebar,
  UserAddress,
  UserHeader,
  UserName
}

import { Link } from 'react-router-dom'
import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 322:101481 — Account sidebar. The panel uses black at 40% (#00000066). Nav idle text
// #CFCDD4, active text #FCFCFC; the active section is a Brand/Violet (#A524B3) pill, the
// destructive Delete item turns DCL Red (#FF2D55) when active. Hardcoded hexes follow the sibling
// profile styled files.

const Sidebar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  width: '100%',
  borderRadius: 16,
  background: 'rgba(0, 0, 0, 0.4)',
  padding: theme.spacing(2),
  gap: theme.spacing(1.5),
  [theme.breakpoints.up('md')]: {
    position: 'sticky',
    top: 96,
    width: 264,
    // Full-height left rail: span from just under the fixed navbar to the bottom of the viewport.
    minHeight: 'calc(100vh - 120px)',
    alignSelf: 'flex-start'
  }
}))

const UserHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(0.5, 0.5, 0)
}))

const Avatar = styled(Box)(() => ({
  position: 'relative',
  width: 48,
  height: 48,
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0
}))

const AvatarImage = styled('img')(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}))

const UserInfo = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  flex: 1
}))

const UserName = styled(Typography)(() => ({
  fontWeight: 700,
  fontSize: 16,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}))

const AddressRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: '#A09BA8',
  fontSize: 13
}))

const CopyButton = styled('button')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 2,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#A09BA8',
  transition: 'color 0.2s ease',
  ['&:hover']: {
    color: '#FCFCFC'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

const Divider = styled(Box)(() => ({
  height: 1,
  width: '100%',
  background: 'rgba(255, 255, 255, 0.1)'
}))

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: '#A09BA8',
  padding: theme.spacing(0, 0.5)
}))

const Nav = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

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
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  background: $active ? '#A524B3' : 'transparent',
  color: $active ? '#FCFCFC' : '#CFCDD4',
  ['&:hover']: {
    background: $active ? '#A524B3' : 'rgba(255, 255, 255, 0.06)',
    color: '#FCFCFC'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

const DeleteNavItem = styled(Link, { shouldForwardProp: prop => prop !== '$active' })<{ $active?: boolean }>(({ theme, $active }) => ({
  ...navItemStaticStyles,
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  background: $active ? '#FF2D55' : 'transparent',
  color: $active ? '#FCFCFC' : '#CFCDD4',
  ['&:hover']: {
    background: $active ? '#FF2D55' : 'rgba(255, 45, 85, 0.12)',
    color: $active ? '#FCFCFC' : '#FF2D55'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

const LogoutButton = styled('button')(({ theme }) => ({
  ...navItemStaticStyles,
  width: '100%',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1),
  background: 'transparent',
  color: '#CFCDD4',
  textAlign: 'left',
  ['&:hover']: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#FCFCFC'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: 2
  }
}))

const BottomGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  marginTop: 'auto',
  paddingTop: theme.spacing(2)
}))

// Mobile dashboard affordance (Figma 776:69124): each nav row shows a trailing chevron to read as
// "tap to open the section". Hidden on desktop, where the sidebar is a persistent rail.
const NavChevron = styled('span')(({ theme }) => ({
  display: 'none',
  marginLeft: 'auto',
  alignItems: 'center',
  color: '#A09BA8',
  ['& .MuiSvgIcon-root']: {
    fontSize: 18
  },
  [theme.breakpoints.down('md')]: {
    display: 'inline-flex'
  }
}))

export {
  AddressRow,
  Avatar,
  AvatarImage,
  BottomGroup,
  CopyButton,
  DeleteNavItem,
  Divider,
  LogoutButton,
  Nav,
  NavChevron,
  NavItem,
  SectionLabel,
  Sidebar,
  UserHeader,
  UserInfo,
  UserName
}

import { Link } from 'react-router-dom'
import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 322:101466 — Account sidebar. Colours mirror the DCL design tokens used across the
// profile area (idle nav #CFCDD4, active text #FCFCFC, muted labels #A09BA8). The active
// section is a solid Brand/Violet (#A524B3) pill; the destructive Delete item turns DCL
// Red (#FF2D55) when active. Hardcoded hexes follow the sibling profile styled files.

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
  color: '#FCFCFC',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}))

const UserAddress = styled(Typography)(() => ({
  fontSize: 13,
  color: '#A09BA8'
}))

const SectionLabel = styled(Typography)(({ theme }) => ({
  display: 'none',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: '#A09BA8',
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

// Theme-independent base shared by the three nav controls. Theme-dependent spacing and the
// colour/pseudo-state rules are applied inline in each styled definition.
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
  gap: theme.spacing(1),
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
  gap: theme.spacing(1),
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
  flexDirection: 'row',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(1),
  [theme.breakpoints.up('md')]: {
    flexDirection: 'column',
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTop: '1px solid rgba(255, 255, 255, 0.15)'
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

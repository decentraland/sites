import { NavLink } from 'react-router-dom'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const WorldPageRoot = styled(Box)(({ theme }) => ({
  maxWidth: 1280,
  marginInline: 'auto',
  width: '100%',
  padding: theme.spacing(3, 2, 8),
  color: dclColors.neutral.softWhite,
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4, 4, 10),
    gridTemplateColumns: '210px minmax(0, 1fr)'
  }
}))

// Roblox-style per-world left rail. Each item is a real route (NavLink), so the
// active tab is driven by the URL — not in-page scrolling.
const SideRail = styled('nav')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  alignSelf: 'start',
  [theme.breakpoints.up('md')]: {
    position: 'sticky',
    top: theme.spacing(14)
  }
}))

const BackLink = styled('button')(({ theme }) => ({
  appearance: 'none',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 1.5),
  color: dclColors.neutral.gray3,
  fontSize: 13,
  fontWeight: 600,
  alignSelf: 'flex-start',
  ['&:hover']: { color: dclColors.neutral.softWhite },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 },
  ['& svg']: { fontSize: 18 }
}))

// `&.active` is the class NavLink puts on the matched link — styling the
// element's own state, the same way `&:hover` does (not a descendant selector).
// Active gets a brand-color left accent bar + filled background.
const RailLink = styled(NavLink)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.25),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.spacing(1),
  fontSize: 14,
  fontWeight: 600,
  color: dclColors.neutral.gray3,
  textDecoration: 'none',
  transition: 'color 150ms ease, background-color 150ms ease',
  ['& svg']: { fontSize: 18 },
  ['&:hover']: { color: dclColors.neutral.softWhite, backgroundColor: 'rgba(252, 252, 252, 0.04)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: -2 },
  ['&.active']: {
    color: dclColors.neutral.softWhite,
    backgroundColor: dclColors.whiteTransparent.subtle
  },
  ['&.active::before']: {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '60%',
    width: 3,
    borderRadius: '0 3px 3px 0',
    backgroundColor: theme.palette.primary.main
  }
}))

const RailBadge = styled('span')(({ theme }) => ({
  marginLeft: 'auto',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: theme.spacing(0.125, 0.75),
  borderRadius: 999,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.primary.main}`
}))

const MainColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  minWidth: 0
}))

const NotFoundBox = styled(Box)(({ theme }) => ({
  gridColumn: '1 / -1',
  padding: theme.spacing(10, 2),
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  color: dclColors.neutral.softWhite
}))

const NotFoundTitle = styled(Typography)({ fontSize: 24, fontWeight: 700 })
const NotFoundHint = styled(Typography)({ fontSize: 14, color: dclColors.neutral.gray3, maxWidth: 480 })

export { BackLink, MainColumn, NotFoundBox, NotFoundHint, NotFoundTitle, RailBadge, RailLink, SideRail, WorldPageRoot }

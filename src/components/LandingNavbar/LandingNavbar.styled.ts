import { keyframes } from '@emotion/react'
import { dclColors, styled } from 'decentraland-ui2'

const MOBILE_BREAKPOINT = '@media (max-width: 991px)'
const DESKTOP_BREAKPOINT = '@media (min-width: 992px)'

const NAV_SHADOW = '0px 1.333px 24px rgba(0,0,0,0.12), 0px 8px 13.333px rgba(0,0,0,0.14), 0px 4px 6.667px rgba(0,0,0,0.2)'
const GLASS_BG = 'rgba(38, 38, 38, 0.8)'
const GLASS_BORDER = '0.5px solid #5E5B67'
const GLASS_SHADOW = '0 2px 20px 16px rgba(0, 0, 0, 0.25)'
const GLASS_BLUR = 'blur(12.5px)'

const avatarPulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`

// NOTE: Do NOT use transform in this animation. backdrop-filter breaks when
// the element has any transform set (even identity matrix), because it creates
// a new stacking context that prevents the blur from seeing through to the page.
const slideDown = keyframes({
  from: {
    opacity: 0
  },
  to: {
    opacity: 1
  }
})

const NavBarRoot = styled('nav')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  // The navbar's own blur is on a ::before pseudo-element so that child
  // dropdowns can have their own independent backdrop-filter. Nested
  // backdrop-filter elements don't compose in CSS — the child would blur
  // the parent's already-blurred content instead of the page behind.
  ['&::before']: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    background: 'rgba(22, 21, 24, 0.75)',
    boxShadow: NAV_SHADOW,
    backdropFilter: 'saturate(1.8) blur(20px)',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    WebkitBackdropFilter: 'saturate(1.8) blur(20px)',
    transition: 'background 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease'
  },
  [MOBILE_BREAKPOINT]: {
    height: 64,
    padding: '12px 16px'
  },
  [DESKTOP_BREAKPOINT]: {
    height: 92,
    padding: '16px 54px',
    ['&::before']: {
      background: 'rgba(22, 21, 24, 0.4)'
    }
  },
  // Minimal variant: transparent on desktop only, mobile keeps the gradient
  ['&.minimal::before']: {
    [DESKTOP_BREAKPOINT]: {
      background: 'transparent',
      boxShadow: 'none',
      backdropFilter: 'none',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      WebkitBackdropFilter: 'none'
    }
  },
  // Logged-in on landing: not sticky, no blur on desktop
  ['&.logged-landing']: {
    [DESKTOP_BREAKPOINT]: {
      position: 'absolute'
    }
  },
  ['&.logged-landing::before']: {
    [DESKTOP_BREAKPOINT]: {
      background: 'transparent',
      boxShadow: 'none',
      backdropFilter: 'none',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      WebkitBackdropFilter: 'none'
    }
  }
})

const NavBarLeft = styled('div')({
  display: 'flex',
  alignItems: 'center',
  [MOBILE_BREAKPOINT]: {
    gap: 12
  },
  [DESKTOP_BREAKPOINT]: {
    gap: 48
  },
  ['& .mobile-only']: {
    display: 'flex',
    [DESKTOP_BREAKPOINT]: { display: 'none' }
  },
  ['& .desktop-only']: {
    display: 'none',
    [DESKTOP_BREAKPOINT]: { display: 'flex' }
  }
})

const NavBarRight = styled('div')({
  display: 'flex',
  alignItems: 'center',
  [MOBILE_BREAKPOINT]: {
    gap: 24
  },
  [DESKTOP_BREAKPOINT]: {
    gap: 48
  }
})

const NavBarRightGroup = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 24
})

const LogoLink = styled('a')({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  width: 40,
  height: 40,
  ['& svg']: {
    width: '100%',
    height: '100%'
  }
})

const Wordmark = styled('span')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: 1.5,
  color: dclColors.neutral.white,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  lineHeight: 1,
  [MOBILE_BREAKPOINT]: {
    display: 'none'
  }
})

const DesktopTabList = styled('div')({
  display: 'none',
  [DESKTOP_BREAKPOINT]: {
    display: 'flex',
    alignItems: 'center',
    gap: 24
  }
})

const DesktopTab = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 24px',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  color: dclColors.neutral.gray5,
  cursor: 'pointer',
  borderRadius: 8,
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  ['&:hover']: {
    color: dclColors.neutral.white,
    backgroundColor: GLASS_BG,
    textShadow: '0 0 0.5px currentColor, 0 0 0.5px currentColor'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  ['& svg']: {
    width: 20,
    height: 20,
    transition: 'transform 0.2s ease',
    flexShrink: 0
  }
})

const DesktopTabLink = styled('a')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 24px',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  color: dclColors.neutral.gray5,
  cursor: 'pointer',
  borderRadius: 8,
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  ['&:hover']: {
    color: dclColors.neutral.white,
    backgroundColor: GLASS_BG,
    textShadow: '0 0 0.5px currentColor, 0 0 0.5px currentColor'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  }
})

const DesktopTabWithDropdown = styled(DesktopTab)({
  paddingRight: 16
})

const DesktopDropdownWrapper = styled('div')({
  position: 'relative',
  // Extra padding at the bottom creates a hover "safe zone" between
  // the tab and the dropdown so the mouse doesn't leave the wrapper.
  paddingBottom: 8,
  marginBottom: -8,
  cursor: 'pointer'
})

const DesktopDropdown = styled('div')({
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 2,
  minWidth: 220,
  background: GLASS_BG,
  backdropFilter: GLASS_BLUR,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: GLASS_BLUR,
  border: GLASS_BORDER,
  borderRadius: 12,
  boxShadow: GLASS_SHADOW,
  padding: 12,
  animation: `${slideDown} 0.15s ease forwards`
})

// Keep for backwards compat but now a passthrough
const DesktopDropdownInner = styled('div')({})

const DesktopDropdownItem = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '8px 16px',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  color: dclColors.neutral.gray4,
  textDecoration: 'none',
  borderRadius: 12,
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: dclColors.neutral.white
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: -2
  },
  ['& svg']: {
    width: 16,
    height: 16,
    flexShrink: 0,
    opacity: 0.6
  }
})

const bellShake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(8deg); }
  50% { transform: rotate(-8deg); }
  75% { transform: rotate(4deg); }
`

const BellButton = styled('button')({
  all: 'unset',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  color: dclColors.neutral.white,
  cursor: 'pointer',
  flexShrink: 0,
  borderRadius: 4,
  ['&.has-unread']: {
    animation: `${bellShake} 0.8s`,
    animationIterationCount: 4
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  ['& svg']: {
    width: 24,
    height: 24
  }
})

const NotificationBadge = styled('span')({
  position: 'absolute',
  top: -4,
  right: -6,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: dclColors.base.primary,
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  lineHeight: 1,
  pointerEvents: 'none'
})

const NotificationWrapper = styled('div')({
  position: 'relative'
})

const NotificationPanel = styled('div')({
  position: 'absolute',
  top: '100%',
  right: -12,
  marginTop: 16,
  width: 390,
  maxHeight: '70vh',
  zIndex: 1102,
  background: GLASS_BG,
  backdropFilter: GLASS_BLUR,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: GLASS_BLUR,
  border: GLASS_BORDER,
  borderRadius: 12,
  boxShadow: GLASS_SHADOW,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  paddingTop: 12,
  paddingBottom: 24,
  animation: `${slideDown} 0.15s ease forwards`,
  [MOBILE_BREAKPOINT]: {
    position: 'fixed',
    top: 64,
    left: 0,
    right: 0,
    width: 'auto',
    maxHeight: 'calc(100vh - 64px)',
    borderRadius: 0
  }
})

const NotificationHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px 12px 24px',
  borderBottom: '0.5px solid #5e5b67'
})

const NotificationTitle = styled('span')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  color: '#fcfcfc'
})

const NotificationList = styled('div')({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  maxHeight: 290,
  padding: '4px 0',
  [MOBILE_BREAKPOINT]: {
    maxHeight: 'calc(100vh - 200px)'
  }
})

const NotificationEmpty = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: '40px 80px',
  textAlign: 'center',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 16,
  color: dclColors.neutral.gray4
})

const NotificationListItem = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 8,
  width: '100%',
  boxSizing: 'border-box',
  transition: 'background-color 0.15s ease',
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  }
})

const NotificationItemImage = styled('div')({
  width: 56,
  height: 56,
  marginLeft: 16,
  borderRadius: '50%',
  backgroundColor: 'rgba(103, 99, 112, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden',
  position: 'relative',
  ['& img']: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'contain'
  }
})

const NotificationDot = styled('div')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: 'transparent',
  flexShrink: 0,
  ['&.unread']: {
    backgroundColor: dclColors.base.primary
  }
})

const NotificationItemContent = styled('div')({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4
})

const NotificationItemTitle = styled('div')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  color: '#fcfcfc',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const NotificationItemTime = styled('div')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 12,
  fontWeight: 400,
  color: '#a09ba8'
})

const NotificationItemDescription = styled('div')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 12,
  fontWeight: 400,
  color: '#ecebed',
  lineHeight: '20px',
  maxWidth: 280,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const AvatarButton = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  borderRadius: 100,
  backgroundColor: '#FF4BED',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  overflow: 'hidden',
  [MOBILE_BREAKPOINT]: {
    width: 40,
    height: 40
  },
  [DESKTOP_BREAKPOINT]: {
    width: 48,
    height: 48
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  ['&.loading']: {
    animation: `${avatarPulse} 1.5s ease-in-out infinite`
  }
})

const AvatarImage = styled('img')({
  borderRadius: 100,
  objectFit: 'cover',
  width: '100%',
  height: '100%'
})

const AvatarFallback = styled('div')({
  borderRadius: 100,
  backgroundColor: '#FF4BED',
  width: '100%',
  height: '100%'
})

const HamburgerButton = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 8,
  color: dclColors.neutral.white,
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background-color 0.15s ease',
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  ['&:active']: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  [DESKTOP_BREAKPOINT]: {
    display: 'none'
  }
})

const JumpInButton = styled('a')({
  display: 'none',
  [DESKTOP_BREAKPOINT]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 40,
    padding: '0 16px',
    backgroundColor: dclColors.base.primary,
    borderRadius: 12,
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: '0.46px',
    textTransform: 'uppercase' as const,
    color: dclColors.neutral.white,
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
    ['&:hover']: {
      backgroundColor: dclColors.base.primaryDark1
    },
    ['&:active']: {
      backgroundColor: dclColors.base.primaryDark2,
      transform: 'scale(0.98)'
    },
    ['&:focus-visible']: {
      outline: `2px solid ${dclColors.neutral.white}`,
      outlineOffset: 2
    },
    ['& svg']: {
      width: 24,
      height: 24,
      flexShrink: 0
    }
  }
})

const SignInButton = styled('button')({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 22px',
  border: `1px solid ${dclColors.neutral.softWhite}`,
  borderRadius: 6,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '24px',
  letterSpacing: 0.46,
  textTransform: 'uppercase' as const,
  color: dclColors.neutral.softWhite,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.7)'
  },
  ['&:active']: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  ['&:disabled']: {
    opacity: 0.5,
    pointerEvents: 'none' as const
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  }
})

/* eslint-disable @typescript-eslint/naming-convention */
const NavJumpInButton = styled('button')({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  height: 40,
  padding: '0 16px',
  backgroundColor: '#FF2D55',
  borderRadius: 12,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '24px',
  letterSpacing: 0.46,
  textTransform: 'uppercase' as const,
  color: '#FCFCFC',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  outline: '2px solid transparent',
  outlineOffset: 2,
  transition: 'outline-color 0.15s ease',
  '&:hover': {
    outlineColor: 'white'
  },
  '&:focus-visible': {
    outlineColor: 'white'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const NavJumpInArrow = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '1.5px solid rgba(252, 252, 252, 0.3)',
  boxSizing: 'border-box',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::after': {
    content: '""',
    display: 'block',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '4px 0 4px 7px',
    borderColor: 'transparent transparent transparent #FCFCFC',
    marginLeft: 2
  }
})

const MobileMenuOverlay = styled('div')<{ open: boolean }>(({ open }) => ({
  position: 'fixed',
  top: 64,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1099,
  pointerEvents: open ? 'auto' : 'none',
  backgroundColor: open ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
  transition: 'background-color 0.25s ease',
  [DESKTOP_BREAKPOINT]: {
    display: 'none'
  }
}))

const MobileMenuPanel = styled('div')<{ open: boolean }>(({ open }) => ({
  position: 'fixed',
  top: 64,
  left: 0,
  right: 0,
  zIndex: 1100,
  maxHeight: open ? 'calc(100vh - 64px)' : 0,
  overflowY: 'auto',
  background: GLASS_BG,
  backdropFilter: GLASS_BLUR,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: GLASS_BLUR,
  boxShadow: open ? GLASS_SHADOW : 'none',
  padding: open ? 12 : '0 12px',
  transition: 'max-height 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease',
  [DESKTOP_BREAKPOINT]: {
    display: 'none'
  }
}))

const MobileMenuItem = styled('div')({
  borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)'
})

const MobileMenuLink = styled('a')({
  display: 'flex',
  alignItems: 'center',
  padding: '24px 16px',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.75,
  color: dclColors.neutral.white,
  textDecoration: 'none',
  ['&:hover']: {
    color: dclColors.neutral.gray5
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: -2
  }
})

const MobileMenuAccordionHeader = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '24px 16px',
  boxSizing: 'border-box',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.75,
  color: dclColors.neutral.white,
  cursor: 'pointer',
  ['&:hover']: {
    color: dclColors.neutral.gray5
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: -2
  },
  ['& svg']: {
    width: 20,
    height: 20,
    flexShrink: 0,
    transition: 'transform 0.2s ease'
  }
})

const MobileMenuSubItems = styled('div')<{ open: boolean }>(({ open }) => ({
  maxHeight: open ? 500 : 0,
  overflow: 'hidden',
  transition: 'max-height 0.25s ease'
}))

const MobileMenuSubItem = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '12px 16px',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  color: dclColors.neutral.gray4,
  textDecoration: 'none',
  ['&:hover']: {
    color: dclColors.neutral.white
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: -2
  },
  ['& svg']: {
    width: 16,
    height: 16,
    flexShrink: 0,
    opacity: 0.6
  }
})

const UserCard = styled('div')({
  position: 'fixed',
  top: 92,
  right: 54,
  zIndex: 1201,
  background: GLASS_BG,
  backdropFilter: GLASS_BLUR,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: GLASS_BLUR,
  border: GLASS_BORDER,
  borderRadius: 12,
  boxShadow: GLASS_SHADOW,
  display: 'none',
  padding: 12,
  gap: 24,
  animation: `${slideDown} 0.15s ease forwards`,
  minWidth: 484,
  [DESKTOP_BREAKPOINT]: {
    display: 'flex'
  }
})

const UserCardAvatarContainer = styled('div')({
  width: 151,
  minHeight: 240,
  borderRadius: 12,
  border: '0.5px solid #c640cd',
  background: 'linear-gradient(180deg, rgba(198, 64, 205, 0.2) 0%, rgba(105, 31, 169, 0.2) 100%)',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0
})

const UserCardAvatarBody = styled('img')({
  width: '100%',
  height: 'auto',
  objectFit: 'cover',
  objectPosition: 'top'
})

const UserCardMenu = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  paddingRight: 12,
  paddingTop: 4,
  paddingBottom: 4,
  flex: 1,
  minWidth: 0,
  [MOBILE_BREAKPOINT]: {
    gap: 12
  }
})

const UserCardName = styled('span')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  color: '#fcfcfc',
  marginBottom: 4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const UserCardAddressLabel = styled('span')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 12,
  color: '#cfcdd4'
})

const UserCardAddress = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 12,
  color: '#fcfcfc',
  marginBottom: 4
})

const UserCardCopyButton = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#fcfcfc',
  opacity: 0.7,
  transition: 'opacity 0.15s ease',
  ['&:hover']: {
    opacity: 1
  }
})

const UserCardMenuItem = styled('a')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 16px',
  borderRadius: 12,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.75,
  color: dclColors.neutral.gray4,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'color 0.15s ease, background-color 0.15s ease',
  ['&:hover']: {
    color: dclColors.neutral.white,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  ['& svg']: {
    width: 20,
    height: 20,
    flexShrink: 0
  }
})

const UserCardDivider = styled('div')({
  height: 0.5,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  margin: '8px 0'
})

const UserCardLogout = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 12,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.75,
  color: dclColors.neutral.gray4,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'color 0.15s ease',
  ['&:hover']: {
    color: dclColors.base.primary
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  },
  ['& svg']: {
    width: 18,
    height: 18
  }
})

const UserCardWrapper = styled('div')({
  position: 'relative'
})

const MobileUserCard = styled('div')({
  position: 'fixed',
  top: 64,
  left: 0,
  right: 0,
  zIndex: 1201,
  background: GLASS_BG,
  backdropFilter: GLASS_BLUR,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: GLASS_BLUR,
  boxShadow: GLASS_SHADOW,
  padding: '24px 12px',
  animation: `${slideDown} 0.15s ease forwards`,
  [DESKTOP_BREAKPOINT]: {
    display: 'none'
  }
})

const MobileUserCardTop = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingBottom: 8
})

const MobileUserCardAvatar = styled('div')({
  width: 73,
  height: 73,
  borderRadius: 100,
  border: '3px solid rgba(255, 255, 255, 0.5)',
  backgroundColor: '#FF4BED',
  overflow: 'hidden',
  flexShrink: 0,
  ['&.loading']: {
    animation: `${avatarPulse} 1.5s ease-in-out infinite`
  }
})

const MobileUserCardAvatarImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 100
})

const MobileUserCardInfo = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0
})

const MobileUserCardName = styled('span')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  color: '#fcfcfc',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const MobileUserCardAddressLabel = styled('span')({
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 12,
  color: '#cfcdd4'
})

const MobileUserCardAddress = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontWeight: 400,
  fontSize: 12,
  color: '#fcfcfc'
})

const ManaBalanceRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  paddingTop: 8
})

/** Mobile variant with left padding aligned to the avatar + gap (73px + 6px border + 12px gap) */
const MobileManaBalanceRow = styled(ManaBalanceRow)({
  paddingLeft: 91
})

const ManaBalanceItem = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  color: '#FCFCFC'
})

const skeletonPulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`

const ManaBalanceSkeleton = styled('div')({
  width: 60,
  height: 16,
  borderRadius: 4,
  backgroundColor: 'rgba(255,255,255,0.12)',
  animation: `${skeletonPulse} 1.5s ease-in-out infinite`
})

const MobileUserCardCopyButton = styled('button')({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#fcfcfc',
  transition: 'opacity 0.15s ease',
  ['&:hover']: {
    opacity: 0.7
  },
  ['& svg']: {
    width: 20,
    height: 20
  }
})

export {
  AvatarButton,
  AvatarFallback,
  AvatarImage,
  BellButton,
  DesktopDropdown,
  DesktopDropdownInner,
  DesktopDropdownItem,
  DesktopDropdownWrapper,
  DesktopTab,
  DesktopTabLink,
  DesktopTabList,
  DesktopTabWithDropdown,
  HamburgerButton,
  JumpInButton,
  LogoLink,
  ManaBalanceItem,
  ManaBalanceRow,
  ManaBalanceSkeleton,
  MobileManaBalanceRow,
  MobileMenuAccordionHeader,
  MobileMenuItem,
  MobileMenuLink,
  MobileMenuOverlay,
  MobileMenuPanel,
  MobileMenuSubItem,
  MobileMenuSubItems,
  MobileUserCard,
  MobileUserCardAddress,
  MobileUserCardAddressLabel,
  MobileUserCardAvatar,
  MobileUserCardAvatarImage,
  MobileUserCardCopyButton,
  MobileUserCardInfo,
  MobileUserCardName,
  MobileUserCardTop,
  NavBarLeft,
  NavBarRight,
  NavBarRightGroup,
  NavBarRoot,
  NotificationBadge,
  NotificationDot,
  NotificationEmpty,
  NotificationHeader,
  NotificationItemContent,
  NotificationItemDescription,
  NotificationItemImage,
  NotificationItemTime,
  NotificationItemTitle,
  NotificationList,
  NotificationListItem,
  NotificationPanel,
  NotificationTitle,
  NotificationWrapper,
  NavJumpInArrow,
  NavJumpInButton,
  SignInButton,
  UserCard,
  UserCardAddress,
  UserCardAddressLabel,
  UserCardAvatarBody,
  UserCardAvatarContainer,
  UserCardCopyButton,
  UserCardDivider,
  UserCardLogout,
  UserCardMenu,
  UserCardMenuItem,
  UserCardName,
  UserCardWrapper,
  Wordmark
}

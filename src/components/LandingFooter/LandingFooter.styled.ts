import { styled } from 'decentraland-ui2'

// ── Main footer (purple gradient) ─────────────────────────────────────
const FooterRoot = styled('footer')({
  width: '100%'
})

const FooterMain = styled('div')(({ theme }) => ({
  width: '100%',
  background:
    'radial-gradient(ellipse at 0% 0%, rgba(121,47,158,0.6) 0%, rgba(74,23,102,0.8) 25%, rgba(51,12,74,0.9) 50%, rgba(27,0,46,1) 75%)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  padding: '32px 180px',
  [theme.breakpoints.down('lg')]: {
    padding: '32px 80px'
  },
  [theme.breakpoints.down('md')]: {
    padding: '32px 40px'
  },
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
    padding: '48px 16px',
    background:
      'radial-gradient(ellipse at 0% 0%, rgba(109,34,151,1) 0%, rgba(89,26,125,1) 12%, rgba(69,18,99,1) 25%, rgba(48,9,72,1) 50%, rgba(28,1,46,1) 75%)'
  }
}))

// ── Left column ───────────────────────────────────────────────────────
const LeftColumn = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '40px 0',
  maxWidth: 450,
  [theme.breakpoints.down('xs')]: {
    padding: 0,
    width: '100%',
    alignItems: 'center',
    maxWidth: '100%',
    gap: 40
  }
}))

const Wordmark = styled('img')(({ theme }) => ({
  height: 20,
  width: 'auto',
  alignSelf: 'flex-start',
  [theme.breakpoints.down('xs')]: {
    height: 40,
    maxWidth: 322,
    alignSelf: 'center'
  }
}))

const NewsletterSection = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  [theme.breakpoints.down('xs')]: {
    width: '100%',
    alignItems: 'center'
  }
}))

const NewsletterTitle = styled('p')(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: 1.6,
  color: '#fcfcfc',
  margin: 0,
  [theme.breakpoints.down('xs')]: {
    textAlign: 'center'
  }
}))

const EmailRow = styled('form')(({ theme }) => ({
  display: 'flex',
  gap: 8,
  height: 46,
  width: '100%',
  maxWidth: 450,
  [theme.breakpoints.down('xs')]: {
    height: 40,
    maxWidth: '100%'
  }
}))

const EmailInput = styled('input')({
  flex: 1,
  height: '100%',
  padding: '0 16px',
  borderRadius: 6,
  border: '1px solid white',
  backgroundColor: '#fcfcfc',
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
  color: '#1b002e',
  outline: 'none',
  boxSizing: 'border-box',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::placeholder': {
    color: '#cfcdd4'
  }
})

const SubscribeButton = styled('button')({
  height: '100%',
  padding: '0 22px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#ff2d55',
  color: 'white',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  fontSize: 15,
  letterSpacing: 0.46,
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  boxSizing: 'border-box',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: '#e0264b'
  }
})

// ── Connect / Social ──────────────────────────────────────────────────
const ConnectSection = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.desktop-only': {
    marginTop: 4,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.mobile-only': {
    display: 'none',
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
      width: '100%',
      paddingTop: 12
    }
  }
}))

const SectionLabel = styled('p')({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  fontSize: 16,
  lineHeight: 1.5,
  color: '#fcfcfc',
  margin: 0,
  textTransform: 'uppercase' as const
})

const SocialRow = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  color: 'white',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& a': {
    color: 'inherit',
    display: 'flex',
    transition: 'opacity 0.2s',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:hover': {
      opacity: 0.7
    }
  }
})

// ── Right column (link columns) ──────────────────────────────────────
const RightColumn = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: 180,
  padding: '40px 0',
  [theme.breakpoints.down('lg')]: {
    gap: 80
  },
  [theme.breakpoints.down('md')]: {
    gap: 48
  },
  [theme.breakpoints.down('xs')]: {
    display: 'none'
  }
}))

const LinkColumn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 8
})

const FooterLink = styled('a')({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 1.5,
  color: '#cfcdd4',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    textDecoration: 'underline'
  }
})

// ── Mobile collapsible menu ──────────────────────────────────────────
const MobileMenu = styled('div')(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('xs')]: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  }
}))

const MobileMenuLabel = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '12px 0',
  borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 1.75,
  color: '#cfcdd4',
  textTransform: 'uppercase' as const
})

const MobileMenuDropdown = styled('button')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '24px 16px 24px 0',
  border: 'none',
  borderBottom: '0.5px solid rgba(255, 255, 255, 0.1)',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.75,
  color: 'white',
  textAlign: 'left'
})

const DropdownChevron = styled('span')<{ open?: boolean }>(({ open }) => ({
  display: 'flex',
  transition: 'transform 0.3s ease',
  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  color: 'white'
}))

const DropdownContent = styled('div')<{ open?: boolean }>(({ open }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  overflow: 'hidden',
  maxHeight: open ? 400 : 0,
  opacity: open ? 1 : 0,
  padding: open ? '16px 0 8px' : '0',
  transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease'
}))

const MobileFooterLink = styled('a')({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 15,
  lineHeight: 1.5,
  color: '#fcfcfc',
  textDecoration: 'none',
  paddingLeft: 8,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    textDecoration: 'underline'
  }
})

// ── Bottom bar (legal links) ─────────────────────────────────────────
const BottomBar = styled('div')(({ theme }) => ({
  width: '100%',
  backgroundColor: '#161518',
  boxShadow: 'inset 0px 1px 0px 0px #43404a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16
  }
}))

const BottomBarLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16
  }
}))

const BottomBarRight = styled('div')(({ theme }) => ({
  [theme.breakpoints.down('xs')]: {
    display: 'none'
  }
}))

const LegalLink = styled('a')({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 1.43,
  color: '#a09ba8',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    color: '#cfcdd4'
  }
})

const CopyrightText = styled('span')({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 15,
  lineHeight: '24px',
  color: '#a09ba8',
  whiteSpace: 'nowrap'
})

const LanguageWrapper = styled('div')({
  position: 'relative'
})

const LanguageButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '24px',
  color: 'white'
})

const LanguageMenu = styled('div')({
  position: 'absolute',
  bottom: '100%',
  left: 0,
  marginBottom: 8,
  backgroundColor: '#242129',
  borderRadius: 8,
  border: '1px solid #43404a',
  padding: '4px 0',
  minWidth: 140,
  zIndex: 10,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& button': {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    color: '#cfcdd4',
    whiteSpace: 'nowrap',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)'
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&.active': {
      color: 'white',
      fontWeight: 600
    }
  }
})

const MobileLegalGrid = styled('div')(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('xs')]: {
    display: 'flex',
    gap: 142,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }
}))

const DesktopLegalLinks = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  [theme.breakpoints.down('xs')]: {
    display: 'none'
  }
}))

export {
  BottomBar,
  BottomBarLeft,
  BottomBarRight,
  ConnectSection,
  CopyrightText,
  DesktopLegalLinks,
  DropdownChevron,
  DropdownContent,
  EmailInput,
  EmailRow,
  FooterLink,
  FooterMain,
  FooterRoot,
  LanguageButton,
  LanguageMenu,
  LanguageWrapper,
  LeftColumn,
  LegalLink,
  LinkColumn,
  MobileFooterLink,
  MobileLegalGrid,
  MobileMenu,
  MobileMenuDropdown,
  MobileMenuLabel,
  NewsletterSection,
  NewsletterTitle,
  RightColumn,
  SectionLabel,
  SocialRow,
  SubscribeButton,
  Wordmark
}

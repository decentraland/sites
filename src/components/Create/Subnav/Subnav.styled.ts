import { dclColors, styled } from 'decentraland-ui2'

const MOBILE_BREAKPOINT = '@media (max-width: 991px)'
const DESKTOP_BREAKPOINT = '@media (min-width: 992px)'

// Values copied from the wemotes-builder theme (subnavOverlay tokens) so the band is
// identical to the collections app's sub-nav.
const SUBNAV_BG = 'rgba(64, 20, 88, 0.2)'
const SUBNAV_BG_SCROLLED = 'rgba(64, 20, 88, 0.8)'
// wemotes' `orange` token — active tab underline. Not in dclColors.
const TAB_ACTIVE_BORDER = '#ff7439'

const SubnavRoot = styled('div')({
  position: 'sticky',
  // Under the fixed LandingNavbar (zIndex 1100); margin-top clears it in flow, top pins
  // the band right below it once the page scrolls.
  zIndex: 1090,
  display: 'flex',
  alignItems: 'center',
  height: 64,
  boxSizing: 'border-box',
  background: SUBNAV_BG,
  backdropFilter: 'blur(12px)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
  transition: 'background 0.25s ease',
  ['&.scrolled']: {
    background: SUBNAV_BG_SCROLLED
  },
  [MOBILE_BREAKPOINT]: {
    top: 64,
    marginTop: 64,
    padding: '0 16px'
  },
  [DESKTOP_BREAKPOINT]: {
    top: 92,
    marginTop: 92,
    padding: '0 54px'
  }
})

const SubnavTabs = styled('nav')({
  display: 'flex',
  gap: 40,
  height: '100%',
  minWidth: 0,
  overflowX: 'auto',
  scrollbarWidth: 'none',
  ['&::-webkit-scrollbar']: {
    display: 'none'
  },
  [MOBILE_BREAKPOINT]: {
    gap: 16,
    // The scrollbar is hidden, so the fade on the right edge is what signals there are
    // more tabs to reach on narrow viewports.
    maskImage: 'linear-gradient(to right, #000 calc(100% - 24px), transparent)',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 24px), transparent)'
  }
})

const SubnavTab = styled('a')({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  color: dclColors.neutral.gray3,
  textDecoration: 'none',
  borderBottom: '4px solid transparent',
  transition: 'color 0.15s ease',
  ['&:hover']: {
    color: dclColors.neutral.white
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: -2
  },
  ['&[aria-current="page"]']: {
    color: dclColors.neutral.white,
    borderBottomColor: TAB_ACTIVE_BORDER
  },
  [MOBILE_BREAKPOINT]: {
    fontSize: 12,
    letterSpacing: '0.038em'
  }
})

export { SubnavRoot, SubnavTab, SubnavTabs }

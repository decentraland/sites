import { dclColors, styled } from 'decentraland-ui2'

const MOBILE_BREAKPOINT = '@media (max-width: 991px)'
const DESKTOP_BREAKPOINT = '@media (min-width: 992px)'

// Values copied from the wemotes-builder theme (subnavOverlay tokens) so the band is
// identical to the collections app's sub-nav.
const SUBNAV_BG = 'rgba(64, 20, 88, 0.2)'
const SUBNAV_BG_SCROLLED = 'rgba(64, 20, 88, 0.8)'
// wemotes' `orange` token — active tab underline. Not in dclColors.
const TAB_ACTIVE_BORDER = '#ff7439'

// Violet field behind the /create bars, so the translucent navbar + sub-nav composite to
// the same colors as the wemotes-builder collections app, whose whole body sits on this
// field. Only the strip the two bars cover is painted; the strip shows the top slice of a
// viewport-sized gradient (background-size 100vh instead of `background-attachment: fixed`,
// which iOS Safari ignores) matching wemotes-builder's fixed body gradient — the shared
// Figma "Radial BG" stops. z-index -1 keeps it under all in-flow content, so scrolled
// sections still pass over it, under the translucent bars.
const CreatorsField = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 156,
  zIndex: -1,
  pointerEvents: 'none',
  backgroundImage: 'radial-gradient(61.64% 109.58% at 50% 54.49%, #952dc6 0%, #7c27a8 25%, #642089 50%, #4b1a6b 75%, #32134c 100%)',
  backgroundSize: '100% 100vh',
  backgroundRepeat: 'no-repeat',
  [MOBILE_BREAKPOINT]: {
    height: 128
  }
})

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

export { CreatorsField, SubnavRoot, SubnavTab, SubnavTabs }

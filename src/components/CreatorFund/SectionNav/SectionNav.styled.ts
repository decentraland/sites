import { Logo, styled } from 'decentraland-ui2'
import { NAVBAR_DESKTOP_QUERY, NAVBAR_HEIGHT, NavButtonLink, creatorFundColors } from '../CreatorFund.styled'

// Stands in for the site navbar on this page, so it borrows its surface:
// translucent softBlack1 with a saturated blur, the same shadow and the same heights.
const NavHeader = styled('header')({
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  backgroundColor: 'rgba(22, 21, 24, 0.75)',
  backdropFilter: 'saturate(1.8) blur(20px)',
  ['WebkitBackdropFilter' as string]: 'saturate(1.8) blur(20px)',
  boxShadow: '0px 1.333px 24px rgba(0,0,0,0.12), 0px 8px 13.333px rgba(0,0,0,0.14), 0px 4px 6.667px rgba(0,0,0,0.2)'
})

const NavBar = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  boxSizing: 'border-box',
  height: NAVBAR_HEIGHT.mobile,
  padding: '12px 16px',
  [NAVBAR_DESKTOP_QUERY]: {
    height: NAVBAR_HEIGHT.desktop,
    padding: '16px 54px'
  }
})

// Logo and name sit side by side as two links: the logo goes to the Decentraland home page and
// the name back to the top of this page.
const Brand = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12
})

const BrandHomeLink = styled('a')({
  display: 'flex',
  flexShrink: 0,
  borderRadius: '50%',
  transition: 'transform 0.15s ease',
  ['&:hover']: {
    transform: 'scale(1.05)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 4
  },
  ['@media (prefers-reduced-motion: reduce)']: {
    transition: 'none',
    ['&:hover']: {
      transform: 'none'
    }
  }
})

const BrandLink = styled('a')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: creatorFundColors.heading,
  textDecoration: 'none',
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 4,
    borderRadius: 4
  }
})

const BrandLogo = styled(Logo)({
  width: 40,
  height: 40,
  flexShrink: 0
})

const BrandText = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.25
})

const BrandName = styled('span')({
  fontSize: 16,
  fontWeight: 600
})

const BrandBy = styled('span')({
  fontSize: 12,
  color: creatorFundColors.mutedText
})

const DesktopLinks = styled('nav')(({ theme }) => ({
  display: 'none',
  alignItems: 'center',
  gap: 4,
  [theme.breakpoints.up('lg')]: {
    display: 'flex'
  }
}))

// Same type and hover as the site navbar tabs: 16px / 400 gray5, white on a glass chip.
const DesktopLink = styled('a')({
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 400,
  color: creatorFundColors.text,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  ['&:hover']: {
    color: creatorFundColors.white,
    backgroundColor: 'rgba(38, 38, 38, 0.8)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.primary}`,
    outlineOffset: 2
  }
})

const DesktopCta = styled(NavButtonLink)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('lg')]: {
    display: 'inline-flex'
  }
}))

const MenuButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 8,
  border: 'none',
  borderRadius: 8,
  background: 'none',
  color: creatorFundColors.heading,
  cursor: 'pointer',
  ['&:hover']: {
    backgroundColor: 'rgba(38, 38, 38, 0.8)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2
  },
  [theme.breakpoints.up('lg')]: {
    display: 'none'
  }
}))

const MobilePanel = styled('nav')(({ theme }) => ({
  borderTop: `1px solid ${creatorFundColors.border}`,
  backgroundColor: creatorFundColors.background,
  [theme.breakpoints.up('lg')]: {
    display: 'none'
  }
}))

const MobileLinks = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '16px',
  [NAVBAR_DESKTOP_QUERY]: {
    padding: '16px 54px'
  }
})

const MobileLink = styled('a')({
  padding: '8px 0',
  fontSize: 16,
  fontWeight: 400,
  color: creatorFundColors.text,
  textDecoration: 'none',
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.white
  }
})

const MobileCta = styled(NavButtonLink)({
  marginTop: 8
})

export {
  Brand,
  BrandBy,
  BrandHomeLink,
  BrandLink,
  BrandLogo,
  BrandName,
  BrandText,
  DesktopCta,
  DesktopLink,
  DesktopLinks,
  MenuButton,
  MobileCta,
  MobileLink,
  MobileLinks,
  MobilePanel,
  NavBar,
  NavHeader
}

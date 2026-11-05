import { Logo, styled } from 'decentraland-ui2'
import { PrimaryButtonLink, SectionInner, creatorFundColors } from '../CreatorFund.styled'

// Sticks under the fixed global navbar (64px mobile / 92px desktop).
const NavHeader = styled('header')(({ theme }) => ({
  position: 'sticky',
  top: 64,
  zIndex: 10,
  borderBottom: `1px solid ${creatorFundColors.border}`,
  backgroundColor: 'rgba(22, 21, 24, 0.8)',
  backdropFilter: 'blur(12px)',
  [theme.breakpoints.up('md')]: {
    top: 92
  }
}))

const NavBar = styled(SectionInner)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  height: 64
}))

const BrandLink = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: creatorFundColors.text,
  textDecoration: 'none',
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 4,
    borderRadius: 4
  }
}))

const BrandLogo = styled(Logo)({
  width: 32,
  height: 32,
  flexShrink: 0
})

const BrandText = styled('span')({
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.25
})

const BrandName = styled('span')({
  fontSize: 14,
  fontWeight: 700
})

const BrandBy = styled('span')({
  fontSize: 11,
  color: creatorFundColors.mutedText
})

const DesktopLinks = styled('nav')(({ theme }) => ({
  display: 'none',
  alignItems: 'center',
  gap: theme.spacing(3),
  [theme.breakpoints.up('lg')]: {
    display: 'flex'
  }
}))

const DesktopLink = styled('a')({
  fontSize: 14,
  fontWeight: 500,
  color: creatorFundColors.mutedText,
  textDecoration: 'none',
  transition: 'color 0.2s',
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.text
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 4,
    borderRadius: 4
  }
})

const DesktopCta = styled(PrimaryButtonLink)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('lg')]: {
    display: 'inline-flex'
  }
}))

const MenuButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  border: 'none',
  borderRadius: 8,
  background: 'none',
  color: creatorFundColors.text,
  cursor: 'pointer',
  ['&:hover']: {
    backgroundColor: creatorFundColors.glass
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

const MobileLinks = styled(SectionInner)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2)
}))

const MobileLink = styled('a')(({ theme }) => ({
  padding: `${theme.spacing(1)} 0`,
  fontWeight: 500,
  color: creatorFundColors.text,
  textDecoration: 'none',
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.primaryHover
  }
}))

const MobileCta = styled(PrimaryButtonLink)(({ theme }) => ({
  marginTop: theme.spacing(1)
}))

export {
  BrandBy,
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

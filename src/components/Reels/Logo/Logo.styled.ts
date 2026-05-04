import { Logo as DclLogo, styled } from 'decentraland-ui2'

const LogoContainer = styled('a')({
  height: 56,
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none'
})

const LogoImage = styled(DclLogo)({
  width: 30,
  height: 30,
  marginLeft: 25
})

const LogoText = styled('img')(({ theme }) => ({
  height: 15.066,
  marginLeft: 8,
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

export { LogoContainer, LogoImage, LogoText }

import { Box, Typography, styled } from 'decentraland-ui2'

const EarnSection = styled('section')(({ theme }) => ({
  height: '80vh',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    height: 'auto',
    padding: `0 ${theme.spacing(4)}`
  }
}))

const EarnBackground = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  overflow: 'hidden',
  ['&::after']: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background:
      'linear-gradient(270deg, rgba(22,21,24,0) 0%, rgba(22,21,24,0.94) 27.27%, #161518 50.52%, rgba(22,21,24,0.92) 76.08%, rgba(22,21,24,0) 100%)'
  },
  ['& video']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center'
  }
})

const EarnContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center'
})

const EarnTitle = styled(Typography)(({ theme }) => ({
  fontSize: 40,
  fontWeight: 700,
  lineHeight: '48px',
  maxWidth: 700,
  color: '#fff',
  ['& span']: {
    background: 'linear-gradient(287deg, #ff2d55 5.21%, #ffbc5b 56.5%)',
    backgroundClip: 'text',
    ['WebkitBackgroundClip' as string]: 'text',
    ['WebkitTextFillColor' as string]: 'transparent'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 24,
    lineHeight: 'normal'
  }
}))

const EarnSubtitle = styled(Typography)(({ theme }) => ({
  textShadow: '0px 4px 20px rgba(0, 0, 0, 0.55)',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 'normal',
  color: '#fff',
  marginTop: 16,
  [theme.breakpoints.down('sm')]: {
    fontSize: 18,
    lineHeight: '24px'
  }
}))

const SkillsContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: 42
})

const SkillBadge = styled(Box)({
  paddingLeft: 16,
  paddingRight: 8,
  borderRadius: 100,
  marginBottom: 8,
  marginRight: 8,
  background: '#fff',
  border: '1px solid #f3f2f5',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 'normal',
  position: 'relative',
  height: 36,
  color: '#43404a',
  display: 'flex',
  alignItems: 'center'
})

const EarnActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 70,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    margin: 0,
    marginTop: 28
  }
}))

const EarnActionBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: '#fff',
  textAlign: 'center',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: '48px',
  ['& a']: {
    marginLeft: 16
  },
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 18,
    width: '100%',
    ['& a']: {
      marginLeft: 0,
      width: '100%',
      marginTop: 16
    }
  }
}))

export { EarnActionBlock, EarnActions, EarnBackground, EarnContent, EarnSection, EarnSubtitle, EarnTitle, SkillBadge, SkillsContainer }

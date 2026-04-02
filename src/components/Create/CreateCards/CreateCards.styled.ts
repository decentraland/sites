import { Box, Typography, styled } from 'decentraland-ui2'

const CreateSection = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '1em',
  width: '100%',
  marginTop: 40,
  marginBottom: 40,
  padding: 0,
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    overflow: 'hidden'
  }
}))

const CreateTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: 48,
  fontWeight: 600,
  lineHeight: '77px',
  color: '#fcfcfc',
  marginTop: 0,
  marginBottom: 32,
  maxWidth: '80vw',
  marginLeft: 'auto',
  marginRight: 'auto',
  ['& span']: {
    background: 'linear-gradient(244deg, #ff2d55 -11.67%, #ffbc5b 88.23%)',
    backgroundClip: 'text',
    ['WebkitBackgroundClip' as string]: 'text',
    ['WebkitTextFillColor' as string]: 'transparent'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 32,
    lineHeight: '40px',
    letterSpacing: '-0.64px'
  }
}))

const CreateCardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  background: '#242129',
  borderRadius: 24,
  width: '100%',
  height: '100%',
  padding: 32,
  alignItems: 'center',
  [theme.breakpoints.down('md')]: {
    minHeight: 700
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    height: 'auto',
    width: '100%',
    padding: 0
  }
}))

const CreateCardImage = styled(Box, {
  shouldForwardProp: prop => prop !== 'bgImage'
})<{ bgImage: string }>(({ theme, bgImage }) => ({
  height: '100%',
  flexShrink: 0,
  backgroundImage: `url(${bgImage})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  marginRight: 24,
  width: '35%',
  minHeight: 530,
  borderRadius: 16,
  transition: 'transform 0.3s ease-in-out',
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  ['@media (hover: hover)']: {
    ['&:hover']: {
      transform: 'scale(1.05)'
    }
  },
  [theme.breakpoints.down('sm')]: {
    height: 223,
    minHeight: 223,
    width: '100%',
    backgroundSize: '100%',
    borderRadius: '24px 24px 0 0',
    marginRight: 0,
    ['& img']: {
      width: 'auto',
      height: '100%',
      transform: 'translate(-50%, -50%)',
      position: 'absolute',
      left: '50%',
      top: '50%'
    }
  }
}))

const CreateCardInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  width: 'calc(65% - 24px)',
  [theme.breakpoints.down('sm')]: {
    padding: '32px 0',
    margin: '0 8px 8px',
    width: 'calc(100% - 16px)'
  }
}))

const CreateCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 600,
  lineHeight: '30px',
  marginBottom: 8,
  [theme.breakpoints.down('lg')]: {
    fontSize: 20,
    lineHeight: '16px'
  }
}))

const CreateCardDescription = styled(Typography)(({ theme }) => ({
  color: '#a09ba8',
  fontSize: 18,
  fontWeight: 400,
  lineHeight: '24px',
  marginBottom: 16,
  marginTop: 0,
  [theme.breakpoints.down('lg')]: {
    fontSize: 16
  }
}))

const TabContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column'
})

const TabButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  borderBottom: 'none',
  height: 24,
  marginBottom: 24,
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
    marginBottom: 24
  }
}))

const TabButton = styled('button', {
  shouldForwardProp: prop => prop !== 'isActive'
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  background: 'none',
  border: 'none',
  borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
  color: isActive ? '#fff' : '#716b7c',
  textTransform: 'uppercase',
  fontSize: 14,
  lineHeight: '16px',
  padding: '0 0 8px',
  marginRight: 24,
  fontWeight: isActive ? 600 : 500,
  cursor: 'pointer',
  outline: 'none',
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  [theme.breakpoints.down('sm')]: {
    padding: '8px 0 0',
    fontSize: 16,
    marginRight: 16
  }
}))

const TabInfoBlock = styled(Box)({
  borderRadius: 16,
  background: '#43404a80',
  padding: '16px 24px',
  marginBottom: 8,
  ['&:last-child']: {
    marginBottom: 0
  }
})

const TabInfoTitle = styled(Typography)({
  fontSize: 18,
  lineHeight: '20px',
  fontWeight: 500,
  marginBottom: 12
})

const TabInfoSubtitle = styled(Typography)({
  color: '#cfcdd4',
  fontSize: 18,
  fontWeight: 400,
  lineHeight: '24px',
  marginBottom: 0
})

const SkillsContainer = styled(Box)({
  display: 'flex',
  flexWrap: 'wrap'
})

const SkillBadge = styled(Box)({
  padding: '8px 16px',
  borderRadius: 16,
  marginRight: 8,
  marginBottom: 8,
  background: '#43404a',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 'normal',
  textTransform: 'uppercase'
})

const LinksContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'row',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column'
  }
}))

const LinkItem = styled('a')({
  fontSize: 16,
  lineHeight: '24px',
  fontWeight: 500,
  textDecorationLine: 'underline',
  color: '#ffa25a',
  width: '50%',
  marginBottom: 8,
  display: 'block',
  ['&:hover, &:active, &:visited, &:focus']: {
    color: '#ffa25a'
  }
})

export {
  CreateCardContainer,
  CreateCardDescription,
  CreateCardImage,
  CreateCardInfo,
  CreateCardTitle,
  CreateSection,
  CreateTitle,
  LinkItem,
  LinksContainer,
  SkillBadge,
  SkillsContainer,
  TabButton,
  TabButtons,
  TabContainer,
  TabInfoBlock,
  TabInfoSubtitle,
  TabInfoTitle
}

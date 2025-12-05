import { Box, ImageListItem, Skeleton, Typography, dclColors, styled } from 'decentraland-ui2'
import { Video } from '../../Video'

const SocialProofCardContainer = styled(ImageListItem)({
  borderRadius: '8px',
  overflow: 'hidden',
  transform: 'translateZ(0)'
})

const SocialProof = styled(Box)(({ theme }) => {
  return {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'center',
    paddingTop: '0',
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: '50%',
      backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
      zIndex: 1
    },
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-end',
      paddingBottom: '70px',
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '50%',
        bottom: 0,
        right: 0,
        backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))'
      }
    }
  }
})

const SocialProofContent = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1
})

const SocialProofContentLoading = styled(Skeleton)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  transform: 'none',
  transformOrigin: 'none'
})

const SocialProofCardTextContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasBackground'
})<{ hasBackground: boolean }>((props) => {
  const { hasBackground, theme } = props
  let hasBackgroundStyle = {}
  if (hasBackground) {
    hasBackgroundStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 2
    }
  }

  return {
    ...hasBackgroundStyle,
    marginLeft: theme.spacing(6.25),
    marginRight: theme.spacing(6.25),
    [theme.breakpoints.down('md')]: {
      textAlign: 'center',
      marginLeft: theme.spacing(2.5),
      marginRight: theme.spacing(2.5)
    }
  }
})

const SocialProofCardQuoteContainer = styled(Box)(({ theme }) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing(3)} ${theme.spacing(2)}`,
    minHeight: theme.spacing(23.75)
  }
})

const SocialProofCardBadgeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: `${theme.spacing(2.75)} ${theme.spacing(2.125)}`,
  minHeight: '190px',
  background: `linear-gradient(243.96deg, ${dclColors.brand.ruby} -11.67%,${dclColors.brand.yellow} 88.23%)`
}))

const SocialProofCardUserContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: theme.spacing(2)
}))

const SocialProofCardQuoteText = styled(Typography)({
  fontSize: '1rem',
  fontWeight: 500,
  color: '#161518',
  textAlign: 'center'
})

const SocialProofCardUserName = styled(Typography)({
  marginLeft: '4px',
  marginRight: '4px',
  color: '#161518'
})

const SocialProofTitle = styled(Typography)({})

const SocialProofCardImage = styled('img')({
  width: '100%'
})

const SocialProofCardVideoMedia = styled(Video)({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

export {
  SocialProofCardContainer,
  SocialProof,
  SocialProofContent,
  SocialProofContentLoading,
  SocialProofCardTextContainer,
  SocialProofCardQuoteContainer,
  SocialProofCardBadgeContainer,
  SocialProofCardUserContainer,
  SocialProofCardQuoteText,
  SocialProofCardUserName,
  SocialProofTitle,
  SocialProofCardImage,
  SocialProofCardVideoMedia
}

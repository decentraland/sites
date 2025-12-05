import { Box, Typography, styled } from 'decentraland-ui2'

const SocialProofSection = styled('section')(({ theme }) => ({
  width: '100%',
  padding: 0,
  margin: 0,
  marginBottom: theme.spacing(18.75),
  position: 'relative',
  minHeight: '600px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  zIndex: 15
}))

const SocialProofContainer = styled(Box)(({ theme }) => {
  return {
    marginLeft: theme.spacing(20),
    marginRight: theme.spacing(20),
    [theme.breakpoints.down('xl')]: {
      marginLeft: theme.spacing(10),
      marginRight: theme.spacing(10)
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2)
    }
  }
})

const SocialProofTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(12)
}))

export { SocialProofSection, SocialProofContainer, SocialProofTitle }

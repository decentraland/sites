import { Box, Typography, styled } from 'decentraland-ui2'
import gridBg from '../../../images/section_connection_grid.webp'

/* eslint-disable @typescript-eslint/naming-convention */
const ConnectSection = styled('section')({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  backgroundImage: `url(${gridBg})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  paddingLeft: 0,
  paddingRight: 0,
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    width: '15%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none'
  },
  '&::before': {
    left: 0,
    background: 'linear-gradient(90deg, rgba(24, 20, 26, 0.8) 0%, rgba(24, 20, 26, 0) 100%)'
  },
  '&::after': {
    right: 0,
    background: 'linear-gradient(270deg, rgba(24, 20, 26, 0.8) 0%, rgba(24, 20, 26, 0) 100%)'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const ConnectTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: 48,
  fontWeight: 600,
  color: '#fcfcfc',
  marginTop: 56,
  marginBottom: 40,
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
    lineHeight: 'normal',
    paddingLeft: 20,
    paddingRight: 20,
    marginTop: 41,
    marginBottom: 36
  }
}))

const ConnectCard = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: '32px 24px',
  background: '#fcfcfc',
  borderRadius: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  boxSizing: 'border-box',
  position: 'relative',
  transition: 'transform 0.3s ease-in-out',
  cursor: 'pointer',
  ['@media (hover: hover)']: {
    ['&:hover']: {
      transform: 'scale(1.05)'
    }
  },
  [theme.breakpoints.down('sm')]: {
    padding: 24
  }
}))

const ConnectCardDescription = styled(Typography)(({ theme }) => ({
  color: '#161518',
  fontSize: 16,
  lineHeight: '24px',
  fontWeight: 400,
  fontStyle: 'italic',
  [theme.breakpoints.down('sm')]: {
    fontSize: 20,
    lineHeight: '30px',
    textAlign: 'center'
  }
}))

const ConnectCardUser = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'flex-start',
  marginTop: 16,
  [theme.breakpoints.down('sm')]: {
    alignItems: 'center',
    marginTop: 24
  }
}))

const ConnectCardUserImage = styled(Box)({
  width: 40,
  minWidth: 40,
  height: 40,
  borderRadius: '50%',
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%'
  }
})

const ConnectCardUserName = styled(Typography)({
  color: '#161518',
  fontSize: 18,
  fontWeight: 700,
  marginTop: 8,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
})

const DiscordContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 56,
  cursor: 'pointer',
  marginBottom: 32,
  [theme.breakpoints.down('sm')]: {
    marginTop: 43
  }
}))

const DiscordTitle = styled(Typography)(({ theme }) => ({
  color: '#fff',
  textAlign: 'center',
  textShadow: '0px 4px 20px rgba(0, 0, 0, 0.55)',
  fontSize: 20,
  fontWeight: 600,
  [theme.breakpoints.down('sm')]: {
    fontSize: 18
  }
}))

const DiscordIcon = styled(Box)(({ theme }) => ({
  ['& img']: {
    width: 93,
    height: 80,
    marginTop: 23
  },
  [theme.breakpoints.down('sm')]: {
    ['& img']: {
      width: 50,
      marginTop: 0
    }
  }
}))

export {
  ConnectCard,
  ConnectCardDescription,
  ConnectCardUser,
  ConnectCardUserImage,
  ConnectCardUserName,
  ConnectSection,
  ConnectTitle,
  DiscordContainer,
  DiscordIcon,
  DiscordTitle
}

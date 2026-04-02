import { Box, Typography, styled } from 'decentraland-ui2'

const WhySection = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '1em',
  width: '100%',
  paddingBottom: 100,
  opacity: 0,
  transition: 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.3s',
  transform: 'translate(0, 100px)',
  ['&.visible']: {
    opacity: 1,
    transform: 'translate(0, 0)'
  },
  [theme.breakpoints.down('sm')]: {
    paddingBottom: 40,
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    overflow: 'hidden'
  }
}))

const WhyTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: 48,
  fontWeight: 600,
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
    fontWeight: 700,
    lineHeight: '40px',
    letterSpacing: '-0.64px'
  }
}))

const WhyGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: 20
  }
}))

const cardGradients: Record<string, string> = {
  join: 'linear-gradient(206deg, #c640cd 2.47%, #691fa9 98.81%)',
  create: 'radial-gradient(2917.83% 156.44% at 16.06% 114.57%, #ff4f57 13.42%, #ffa25a 100%)',
  benefit: 'linear-gradient(208deg, #ff2d55 13.94%, #c640cd 80.96%)'
}

const WhyCard = styled(Box, {
  shouldForwardProp: prop => prop !== 'cardId'
})<{ cardId: string }>(({ theme, cardId }) => ({
  opacity: 1,
  maxWidth: 450,
  flexShrink: 0,
  borderRadius: 24,
  marginRight: 24,
  flex: 1,
  background: cardGradients[cardId] || cardGradients.join,
  ['&:last-child']: {
    marginRight: 0
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: '100%',
    marginRight: 0
  }
}))

const WhyCardInner = styled(Box)(({ theme }) => ({
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 24px 32px',
  position: 'relative',
  borderRadius: 20,
  overflow: 'hidden',
  flex: 1,
  transition: 'transform 0.3s ease-in-out',
  ['@media (hover: hover)']: {
    ['&:hover']: {
      transform: 'scale(1.05)'
    }
  },
  [theme.breakpoints.down('sm')]: {
    padding: '26px 24px',
    justifyContent: 'flex-start'
  }
}))

const WhyCardImageContainer = styled(Box)(({ theme }) => ({
  borderRadius: 16,
  width: '100%',
  marginBottom: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  ['& img']: {
    flex: '1 1 auto',
    minHeight: 0,
    objectFit: 'contain',
    maxWidth: '100%'
  },
  [theme.breakpoints.down('sm')]: {
    height: 138,
    minHeight: 138,
    marginBottom: 16,
    ['& img']: {
      maxWidth: 'none',
      minHeight: '100%',
      minWidth: '100%'
    }
  }
}))

const WhyCardText = styled(Box)({
  alignSelf: 'flex-start',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start'
})

const WhyCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  lineHeight: '30px',
  fontWeight: 600,
  marginBottom: 8,
  paddingLeft: 10,
  paddingRight: 10,
  [theme.breakpoints.down('sm')]: {
    fontWeight: 700,
    fontSize: 20,
    lineHeight: '28px'
  }
}))

const WhyCardDescription = styled(Typography)(({ theme }) => ({
  fontSize: 18,
  lineHeight: '24px',
  fontWeight: 400,
  marginTop: 0,
  paddingLeft: 10,
  paddingRight: 10,
  [theme.breakpoints.down('sm')]: {
    color: '#fff'
  }
}))

export { WhyCard, WhyCardDescription, WhyCardImageContainer, WhyCardInner, WhyCardText, WhyCardTitle, WhyGrid, WhySection, WhyTitle }

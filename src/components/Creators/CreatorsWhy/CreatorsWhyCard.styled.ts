import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const CARD_GRADIENTS: Record<string, string> = {
  join: `linear-gradient(206deg, ${dclColors.brand.lavender} 2.47%, ${dclColors.brand.purple} 98.81%)`,
  create: `radial-gradient(2917.83% 156.44% at 16.06% 114.57%, #ff4f57 13.42%, ${dclColors.brand.melon} 100%)`,
  benefit: `linear-gradient(208deg, ${dclColors.brand.ruby} 13.94%, ${dclColors.brand.lavender} 80.96%)`
}

const CreatorsWhyCardContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'cardId'
})<{ cardId?: string }>(({ theme, cardId }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: theme.spacing(3, 3, 4),
  borderRadius: '20px',
  background:
    cardId && CARD_GRADIENTS[cardId]
      ? CARD_GRADIENTS[cardId]
      : `linear-gradient(206deg, ${dclColors.brand.lavender} 2.47%, ${dclColors.brand.purple} 98.81%)`,
  height: '100%',
  overflow: 'hidden',
  transition: 'transform 0.3s ease-in-out',
  ['&:hover']: {
    transform: 'scale(1.05)'
  }
}))

const CreatorsWhyCardImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  borderRadius: '16px',
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  ['& img']: {
    width: '100%',
    objectFit: 'contain',
    maxWidth: '100%'
  },
  [theme.breakpoints.down('sm')]: {
    height: '138px',
    minHeight: '138px',
    ['& img']: {
      minHeight: '100%',
      minWidth: '100%',
      maxWidth: 'none'
    }
  }
}))

const CreatorsWhyCardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '30px',
  marginBottom: theme.spacing(1),
  paddingLeft: theme.spacing(1.25),
  paddingRight: theme.spacing(1.25),
  color: dclColors.neutral.white,
  [theme.breakpoints.down('sm')]: {
    fontWeight: 700,
    fontSize: '20px',
    lineHeight: '28px'
  }
}))

const CreatorsWhyCardDescription = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  lineHeight: '24px',
  fontWeight: 400,
  color: dclColors.neutral.white,
  paddingLeft: theme.spacing(1.25),
  paddingRight: theme.spacing(1.25)
}))

export { CreatorsWhyCardContainer, CreatorsWhyCardDescription, CreatorsWhyCardImageContainer, CreatorsWhyCardTitle }

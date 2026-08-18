import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { CreateSectionTitle } from '../SectionTitle.styled'

const WhySection = styled('section')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '1em',
  width: '100%',
  paddingBottom: 100,
  [theme.breakpoints.down('sm')]: {
    paddingBottom: 40,
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    overflow: 'hidden'
  }
}))

const WhyTitle = styled(CreateSectionTitle)({
  marginTop: 0,
  marginBottom: 32
})

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

const WhyCard = styled('a', {
  shouldForwardProp: prop => prop !== 'cardId'
})<{ cardId: string }>(({ theme, cardId }) => ({
  opacity: 1,
  maxWidth: 450,
  flexShrink: 0,
  borderRadius: 24,
  marginRight: 24,
  flex: 1,
  background: cardGradients[cardId] || cardGradients.join,
  cursor: 'pointer',
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  ['&:last-child']: {
    marginRight: 0
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  },
  // The CTA reads this variable, so it reveals on card hover/focus without a
  // descendant selector; devices without hover keep the fallback (always shown).
  ['@media (hover: hover)']: {
    ['--why-cta-reveal' as string]: '0',
    ['&:hover, &:focus-visible']: {
      ['--why-cta-reveal' as string]: '1'
    }
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

// Follows the landing page's CTA language (uppercase, 0.61px tracking, rounded
// rectangle, white with softBlack2 text — see Home/Hero EpicButton).
const WhyCardButton = styled('div')(({ theme }) => ({
  alignSelf: 'flex-start',
  marginTop: 16,
  marginLeft: 10,
  marginRight: 10,
  padding: '10px 24px',
  borderRadius: 12,
  backgroundColor: dclColors.neutral.white,
  color: dclColors.neutral.softBlack2,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  letterSpacing: '0.61px',
  textTransform: 'uppercase',
  opacity: 'var(--why-cta-reveal, 1)',
  transform: 'translateY(calc((1 - var(--why-cta-reveal, 1)) * 8px))',
  transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
  ['&:hover']: {
    backgroundColor: dclColors.neutral.gray5
  },
  [theme.breakpoints.down('sm')]: {
    marginTop: 12
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
    color: dclColors.neutral.white
  }
}))

export {
  WhyCard,
  WhyCardButton,
  WhyCardDescription,
  WhyCardImageContainer,
  WhyCardInner,
  WhyCardText,
  WhyCardTitle,
  WhyGrid,
  WhySection,
  WhyTitle
}

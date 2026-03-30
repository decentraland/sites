import { Box, Typography, styled } from 'decentraland-ui2'

const FaqsSection = styled('section')(({ theme }) => ({
  width: '100%',
  position: 'relative',
  margin: 'auto',
  color: theme.palette.text.primary,
  padding: `${theme.spacing(25)} ${theme.spacing(20)}`,
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(6)} ${theme.spacing(4)} ${theme.spacing(40)}`
  }
}))

const FaqsInnerBorder = styled(Box)(({ theme }) => ({
  background: `
    linear-gradient(to right, ${theme.palette.text.primary} 4px, transparent 4px) 0 0,
    linear-gradient(to right, ${theme.palette.text.primary} 4px, transparent 4px) 0 100%,
    linear-gradient(to left, ${theme.palette.text.primary} 4px, transparent 4px) 100% 0,
    linear-gradient(to left, ${theme.palette.text.primary} 4px, transparent 4px) 100% 100%,
    linear-gradient(to bottom, ${theme.palette.text.primary} 4px, transparent 4px) 0 0,
    linear-gradient(to bottom, ${theme.palette.text.primary} 4px, transparent 4px) 100% 0,
    linear-gradient(to top, ${theme.palette.text.primary} 4px, transparent 4px) 0 100%,
    linear-gradient(to top, ${theme.palette.text.primary} 4px, transparent 4px) 100% 100%
  `,
  backgroundRepeat: 'no-repeat',
  backgroundSize: '20px 20px',
  [theme.breakpoints.down('sm')]: {
    background: `
      linear-gradient(to right, ${theme.palette.text.primary} 2px, transparent 2px) 0 0,
      linear-gradient(to right, ${theme.palette.text.primary} 2px, transparent 2px) 0 100%,
      linear-gradient(to left, ${theme.palette.text.primary} 2px, transparent 2px) 100% 0,
      linear-gradient(to left, ${theme.palette.text.primary} 2px, transparent 2px) 100% 100%,
      linear-gradient(to bottom, ${theme.palette.text.primary} 2px, transparent 2px) 0 0,
      linear-gradient(to bottom, ${theme.palette.text.primary} 2px, transparent 2px) 100% 0,
      linear-gradient(to top, ${theme.palette.text.primary} 2px, transparent 2px) 0 100%,
      linear-gradient(to top, ${theme.palette.text.primary} 2px, transparent 2px) 100% 100%
    `,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '10px 10px'
  }
}))

const FaqsContainer = styled(Box)(({ theme }) => ({
  margin: 'auto',
  width: '100%',
  maxWidth: '1000px',
  padding: `${theme.spacing(9)} 0 ${theme.spacing(25)}`,
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(16)} 0 ${theme.spacing(18)}`
  }
}))

const FaqsSubtitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: theme.typography.body2.fontSize,
  lineHeight: '19px',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  padding: 0,
  margin: 0
}))

const FaqsTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: 'clamp(2.25rem, 15.789vw - 6.632rem, 6rem)',
  lineHeight: 'clamp(2.7rem, 21.474vw - 9.379rem, 7.8rem)',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  paddingBottom: '0.5em',
  [theme.breakpoints.down('sm')]: {
    fontWeight: 700,
    fontSize: '36px',
    lineHeight: '36px',
    textAlign: 'center',
    letterSpacing: '-0.01em'
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const FaqAccordionItem = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen'
})<{ isOpen: boolean }>(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '56px',
  padding: `${theme.spacing(3.5)} ${theme.spacing(5)} ${theme.spacing(3.5)} ${theme.spacing(14)}`,
  position: 'relative',
  overflow: 'hidden',
  zIndex: 1,
  backgroundColor: theme.palette.background.default,
  marginBottom: theme.spacing(5),
  cursor: 'pointer',
  outline: 'none',
  '&::after': {
    width: '100%',
    height: '100%',
    content: '" "',
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'linear-gradient(90deg, #43404a 0%, #691fa9 100%), #242129',
    zIndex: -1,
    opacity: 0,
    transition: 'opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1)'
  },
  '&:hover::after': {
    opacity: 1
  },
  '&:active::after': {
    opacity: 1
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  '& svg.open, & svg.close': {
    width: '57px',
    height: '57px',
    minWidth: '57px',
    minHeight: '57px',
    transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)'
  },
  '& svg.open': {
    transform: 'rotate(180deg)'
  },
  [theme.breakpoints.down('xs')]: {
    padding: `${theme.spacing(5)} ${theme.spacing(5)} ${theme.spacing(5)} ${theme.spacing(9)}`,
    marginBottom: theme.spacing(2.5),
    borderRadius: '50px',
    '& svg.close, & svg.open': {
      width: '48px',
      height: '48px',
      minWidth: '48px',
      minHeight: '48px'
    }
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const FaqQuestionRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
})

const FaqQuestionText = styled(Typography)(({ theme }) => ({
  fontStyle: 'normal',
  fontWeight: 300,
  fontSize: '28px',
  lineHeight: '28px',
  letterSpacing: '-0.011em',
  color: theme.palette.text.secondary,
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    fontWeight: 300,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: '28px',
    letterSpacing: '-0.01em'
  }
}))

const FaqAnswerContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen'
})<{ isOpen: boolean }>(({ isOpen }) => ({
  display: 'grid',
  gridTemplateRows: isOpen ? '1fr' : '0fr',
  opacity: isOpen ? 1 : 0,
  pointerEvents: isOpen ? 'auto' : 'none',
  transition: 'grid-template-rows 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)'
}))

/* eslint-disable @typescript-eslint/naming-convention */
const FaqAnswerText = styled(Typography)(({ theme }) => ({
  overflow: 'hidden',
  padding: '1em 0 2em',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: theme.typography.body1.fontSize,
  lineHeight: '165%',
  whiteSpace: 'pre-line',
  color: theme.palette.text.primary,
  [theme.breakpoints.down('xs')]: {
    fontWeight: 400,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: '24px'
  }
}))

const FaqsCta = styled('a')(({ theme }) => ({
  marginTop: theme.spacing(5),
  width: 'fit-content',
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${theme.spacing(3)} ${theme.spacing(8)}`,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.text.primary}`,
  color: theme.palette.text.primary,
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 200ms ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  '&:active': {
    backgroundColor: theme.palette.action.selected
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  [theme.breakpoints.down('xs')]: {
    width: '100%'
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

export {
  FaqAccordionItem,
  FaqAnswerContainer,
  FaqAnswerText,
  FaqQuestionRow,
  FaqQuestionText,
  FaqsContainer,
  FaqsCta,
  FaqsInnerBorder,
  FaqsSection,
  FaqsSubtitle,
  FaqsTitle
}

import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const FaqsSection = styled('section')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(12.5, 5),
  position: 'relative',
  margin: 'auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2, 20)
  }
}))

const FaqsContainer = styled(Box)({
  margin: 'auto',
  width: '100%',
  maxWidth: '1000px',
  display: 'flex',
  flexDirection: 'column'
})

const FaqsSubtitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: '16px',
  lineHeight: '19px',
  fontWeight: 600,
  color: dclColors.neutral.gray3,
  textTransform: 'uppercase',
  padding: 0,
  margin: 0,
  marginBottom: theme.spacing(1)
}))

const FaqsTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  paddingBottom: '0.5em',
  whiteSpace: 'pre-line',
  [theme.breakpoints.down('sm')]: {
    fontSize: '36px',
    lineHeight: '36px'
  }
}))

const FaqItem = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen'
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(7),
  padding: `${theme.spacing(1.75)} ${theme.spacing(2.5)} ${theme.spacing(1.75)} ${theme.spacing(7)}`,
  position: 'relative',
  overflow: 'hidden',
  zIndex: 1,
  backgroundColor: dclColors.neutral.softBlack2,
  marginBottom: theme.spacing(2.5),
  cursor: 'pointer',
  ['&::after']: {
    width: '100%',
    height: '100%',
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    background: `linear-gradient(90deg, ${dclColors.neutral.gray0} 0%, ${dclColors.brand.purple} 100%), ${dclColors.neutral.softBlack2}`,
    zIndex: -1,
    opacity: isOpen ? 1 : 0,
    transition: 'opacity 1200ms cubic-bezier(0.16, 1, 0.3, 1)'
  },
  ['&:hover::after']: {
    opacity: 1
  },
  [theme.breakpoints.down('xs')]: {
    padding: `${theme.spacing(2.625)} ${theme.spacing(2.625)} ${theme.spacing(2.625)} ${theme.spacing(4.5)}`,
    marginBottom: theme.spacing(1.25),
    borderRadius: theme.spacing(6.25)
  }
}))

const FaqQuestion = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
})

const FaqQuestionText = styled('h4')(({ theme }) => ({
  fontStyle: 'normal',
  fontWeight: 300,
  fontSize: '28px',
  lineHeight: '28px',
  letterSpacing: '-0.011em',
  color: dclColors.neutral.gray4,
  margin: 0,
  [theme.breakpoints.down('xs')]: {
    fontSize: '16px',
    lineHeight: '28px',
    letterSpacing: '-0.01em'
  }
}))

const FaqAnswer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen'
})<{ isOpen: boolean }>(({ isOpen }) => ({
  maxHeight: isOpen ? '500px' : '0',
  opacity: isOpen ? 1 : 0,
  overflow: 'hidden',
  transition: 'max-height 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 350ms cubic-bezier(0.16, 1, 0.3, 1)'
}))

const FaqAnswerText = styled(Typography)(({ theme }) => ({
  padding: '1em 0 2em',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '16px',
  lineHeight: '165%',
  whiteSpace: 'pre-line',
  color: dclColors.neutral.gray5,
  [theme.breakpoints.down('xs')]: {
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px'
  }
}))

const FaqChevron = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen'
})<{ isOpen: boolean }>(({ theme, isOpen }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: theme.spacing(7.125),
  minHeight: theme.spacing(7.125),
  transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  [theme.breakpoints.down('xs')]: {
    minWidth: theme.spacing(6),
    minHeight: theme.spacing(6)
  }
}))

const FaqsCta = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2.5),
  width: 'fit-content',
  alignSelf: 'center',
  [theme.breakpoints.down('xs')]: {
    width: '100%'
  }
}))

export {
  FaqAnswer,
  FaqAnswerText,
  FaqChevron,
  FaqItem,
  FaqQuestion,
  FaqQuestionText,
  FaqsContainer,
  FaqsCta,
  FaqsSection,
  FaqsSubtitle,
  FaqsTitle
}

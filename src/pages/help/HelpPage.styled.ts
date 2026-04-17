import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Typography, styled } from 'decentraland-ui2'


const HelpPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  position: 'relative',
  minHeight: '100vh',
  padding: theme.spacing(15, 2.5, 2.5),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(10, 0, 0)
  }
}))

const HelpSidebar = styled(Box)(({ theme }) => ({
  flex: '0 1 300px',
  marginLeft: theme.spacing(6),
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(5)
  },
  [theme.breakpoints.down('sm')]: {
    flex: '0 1 auto',
    marginLeft: 0,
    width: '100%',
    padding: `0 ${theme.spacing(2)}`
  }
}))

const HelpSidebarTexts = styled(Box)(({ theme }) => ({
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    maxWidth: 380
  }
}))

const HelpSidebarTitle = styled(Typography)(({ theme }) => ({
  fontSize: 30,
  fontWeight: 600,
  lineHeight: '36px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 24,
    lineHeight: '29px'
  }
}))

const HelpSidebarDescription = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '24px',
  color: 'rgba(252, 252, 252, 0.8)',
  [theme.breakpoints.down('sm')]: {
    fontSize: 12,
    lineHeight: '18px'
  }
}))

const HelpMobileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  [theme.breakpoints.down('sm')]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& > h2': {
      width: 200
    }
  }
}))

const HelpTabButtonsContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)} ${theme.spacing(1.5)} 0`,
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexDirection: 'row'
  }
}))

const HelpTabButton = styled(Button)<{ active?: boolean }>(({ theme, active }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(1),
  height: 40,
  borderRadius: 8,
  background: active ? '#ffffff' : 'transparent',
  backgroundImage: 'none',
  color: active ? '#161518' : '#cfcdd4',
  textTransform: 'none',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '17px',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  marginBottom: theme.spacing(1),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
    backgroundImage: 'none'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& svg': {
    height: 20,
    width: 20
  }
}))

const HelpContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  marginTop: theme.spacing(2.25),
  marginLeft: theme.spacing(10),
  [theme.breakpoints.down('sm')]: {
    marginTop: 0,
    marginLeft: 0,
    maxWidth: 375,
    width: '100%'
  }
}))

const HelpSectionTexts = styled(Box)(({ theme }) => ({
  gap: theme.spacing(1)
}))

const HelpSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 22,
  fontWeight: 600,
  lineHeight: '27px',
  [theme.breakpoints.down('sm')]: {
    fontSize: 20,
    lineHeight: '24px'
  }
}))

const HelpSectionDescription = styled(Typography)({
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '24px',
  color: 'rgba(252, 252, 252, 0.8)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& a': {
    color: 'inherit',
    textDecoration: 'underline'
  }
})

const FaqAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  minWidth: 661,
  maxWidth: 661,
  minHeight: 64,
  background: '#331636',
  backgroundImage: 'none',
  borderRadius: '27px !important',
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  boxShadow: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: '#3d1a41',
    backgroundImage: 'none'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:before': {
    display: 'none'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.Mui-expanded': {
    margin: `0 0 ${theme.spacing(1)} 0`,
    minHeight: 'unset',
    background: '#3d1a41',
    backgroundImage: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    minWidth: 'unset',
    maxWidth: '100%',
    width: '100%'
  }
}))

const FaqAccordionSummary = styled(AccordionSummary)({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiAccordionSummary-content': {
    margin: 0,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiAccordionSummary-expandIconWrapper': {
    display: 'none'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'transparent'
  },
  minHeight: 40,
  padding: 0,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.Mui-expanded': {
    minHeight: 40
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& svg': {
    height: 40,
    minHeight: 40,
    width: 40,
    minWidth: 40,
    flexShrink: 0
  }
})

const FaqAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: `${theme.spacing(1)} 0 0 ${theme.spacing(3)}`,
  whiteSpace: 'pre-line',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& p': {
    fontSize: 14,
    lineHeight: '22px',
    color: 'rgba(252, 252, 252, 0.8)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& a': {
    color: '#FCFCFC',
    textDecoration: 'underline'
  }
}))

const FaqQuestion = styled(Typography)({
  fontSize: 16,
  fontWeight: 300,
  lineHeight: '24px',
  marginLeft: 24
})

const AccordionContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2)
}))

const MobileStatusWrapper = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('sm')]: {
    display: 'flex'
  }
}))

const DesktopStatusWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginRight: theme.spacing(6.25),
  minWidth: 173,
  alignItems: 'flex-start',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const ScrollableAccordionContainer = styled(AccordionContainer)(({ theme }) => ({
  maxHeight: 360,
  overflowY: 'auto',
  paddingRight: theme.spacing(0.5),
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::-webkit-scrollbar': {
    width: 4
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4
  },
  [theme.breakpoints.down('sm')]: {
    maxHeight: 300
  }
}))

const ChatCtaBanner = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  minWidth: 661,
  maxWidth: 661,
  background: 'linear-gradient(135deg, #3d1a4a 0%, #280d2b 100%)',
  borderRadius: 27,
  padding: theme.spacing(3, 4),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  [theme.breakpoints.down('sm')]: {
    minWidth: 'unset',
    maxWidth: '100%',
    width: '100%',
    padding: theme.spacing(2.5, 2),
    borderRadius: 20
  }
}))

const ChatCtaBannerTexts = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(2)
  }
}))

const ChatCtaBannerTitle = styled(Typography)({
  fontSize: 18,
  fontWeight: 600,
  lineHeight: '24px',
  color: '#fcfcfc'
})

const ChatCtaBannerSubtitle = styled(Typography)({
  fontSize: 13,
  fontWeight: 400,
  lineHeight: '20px',
  color: 'rgba(252, 252, 252, 0.7)',
  maxWidth: 380
})

const ChatCtaBannerContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  }
}))

const ChatCtaButton = styled(Button)({
  flexShrink: 0,
  backgroundColor: '#ff2d78',
  color: '#ffffff',
  backgroundImage: 'none',
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '16.94px',
  whiteSpace: 'nowrap',
  textTransform: 'none',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: '#e0215e',
    backgroundImage: 'none'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    transform: 'scale(0.97)'
  }
})

export {
  AccordionContainer,
  ChatCtaBanner,
  ChatCtaBannerContent,
  ChatCtaBannerSubtitle,
  ChatCtaBannerTexts,
  ChatCtaBannerTitle,
  ChatCtaButton,
  DesktopStatusWrapper,
  FaqAccordion,
  FaqAccordionDetails,
  FaqAccordionSummary,
  FaqQuestion,
  HelpContentArea,
  HelpMobileHeader,
  HelpPageContainer,
  HelpSectionDescription,
  HelpSectionTexts,
  HelpSectionTitle,
  HelpSidebar,
  HelpSidebarDescription,
  HelpSidebarTexts,
  HelpSidebarTitle,
  HelpTabButton,
  HelpTabButtonsContainer,
  MobileStatusWrapper,
  ScrollableAccordionContainer
}

// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { Box, Typography, styled } from 'decentraland-ui2'

const PageBackground = styled(Box)({
  position: 'fixed',
  inset: 0,
  zIndex: -1,
  background: 'radial-gradient(52.86% 115.71% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 80%, rgba(105, 31, 169, 0.3) 0%, transparent 60%)'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const PageContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  padding: '32px 100px 32px',
  paddingTop: 'calc(66px + 32px)',
  [theme.breakpoints.down('lg')]: {
    padding: '32px 48px 32px',
    paddingTop: 'calc(66px + 32px)'
  },
  [theme.breakpoints.down('md')]: {
    padding: 0,
    paddingTop: 66
  }
}))

const HeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  height: 68,
  paddingLeft: 20,
  [theme.breakpoints.down('md')]: {
    height: 'auto',
    padding: '0 0 0 0',
    gap: 0
  }
}))

const BackButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  borderRadius: '50%',
  width: 36,
  height: 36,
  padding: 0,
  cursor: 'pointer',
  color: theme.palette.text.primary,
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.08)'
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.text.primary}`,
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const BackArrowIcon = styled(ArrowBackIosNewIcon)({
  fontSize: 20
})

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: 32,
  fontWeight: 500,
  lineHeight: 1.235,
  color: '#fcfcfc',
  fontFamily: "'Inter', sans-serif",
  [theme.breakpoints.down('md')]: {
    fontSize: 20,
    lineHeight: 1.6,
    textAlign: 'center',
    flex: 1
  }
}))

export { BackArrowIcon, BackButton, HeaderRow, PageBackground, PageContent, PageTitle }

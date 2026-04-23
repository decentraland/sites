import { Box, Typography, styled } from 'decentraland-ui2'

const SLIDE_UP_DURATION = '0.4s'

const UpcomingSection = styled('section')(({ theme }) => ({
  position: 'relative',
  zIndex: 9,
  marginTop: theme.spacing(4),
  animation: `slideUp ${SLIDE_UP_DURATION} ease-out`,
  ['@keyframes slideUp']: {
    from: { transform: 'translateY(20px)' },
    to: { transform: 'translateY(0)' }
  },
  marginLeft: theme.spacing(-8),
  marginRight: theme.spacing(-8),
  padding: theme.spacing(4, 8),
  [theme.breakpoints.down('lg')]: {
    marginLeft: theme.spacing(-4),
    marginRight: theme.spacing(-4),
    padding: theme.spacing(4, 4)
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(-3),
    marginRight: theme.spacing(-3),
    padding: theme.spacing(4, 3)
  },
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    marginRight: 0,
    padding: theme.spacing(3, 2)
  }
}))

const UpcomingTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: 32,
  lineHeight: 1.235,
  marginBottom: 32,
  [theme.breakpoints.down('md')]: {
    textAlign: 'center'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 24
  }
}))

const MobileCarousel = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'block'
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const MobileCarouselTrack = styled(Box)({
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    display: 'none'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

/* eslint-disable @typescript-eslint/naming-convention */
const MobileCarouselPage = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  flex: '0 0 100%',
  scrollSnapAlign: 'start',
  '@media (max-width: 600px)': {
    gridTemplateColumns: 'minmax(0, 430px)',
    justifyContent: 'center',
    '& > *:nth-of-type(n+3)': {
      display: 'none'
    }
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const DesktopGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(max(300px, calc((100% - 72px) / 4)), 1fr))',
  gap: 24,
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

export { DesktopGrid, MobileCarousel, MobileCarouselPage, MobileCarouselTrack, UpcomingSection, UpcomingTitle }

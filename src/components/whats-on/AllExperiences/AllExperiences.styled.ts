import { Box, Typography, styled } from 'decentraland-ui2'

const SECTION_TITLE_MARGIN_BOTTOM = 28
const COLUMNS_GAP = 16
const SLIDE_UP_DURATION = '0.4s'
const SLIDE_UP_DELAY = '0.15s'

const AllExperiencesSection = styled('section')(({ theme }) => ({
  position: 'relative',
  zIndex: 8,
  marginTop: theme.spacing(4),
  scrollMarginTop: 96,
  [theme.breakpoints.down('md')]: {
    scrollMarginTop: 72
  },
  animation: `slideUp ${SLIDE_UP_DURATION} ease-out ${SLIDE_UP_DELAY}`,
  ['@keyframes slideUp']: {
    from: { transform: 'translateY(20px)' },
    to: { transform: 'translateY(0)' }
  },
  marginLeft: theme.spacing(-8),
  marginRight: theme.spacing(-8),
  padding: theme.spacing(8, 8),
  background: 'radial-gradient(63.39% 112.69% at 49.33% 50.11%, #6B2A8A 0%, #1E0A2E 100%)',
  [theme.breakpoints.down('lg')]: {
    marginLeft: theme.spacing(-4),
    marginRight: theme.spacing(-4),
    padding: theme.spacing(8, 4)
  },
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(-3),
    marginRight: theme.spacing(-3),
    padding: theme.spacing(6, 3)
  },
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    marginRight: 0,
    padding: theme.spacing(4, 2)
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: 32,
  lineHeight: 1.235,
  marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
  [theme.breakpoints.down('sm')]: {
    fontSize: 24,
    textAlign: 'center'
  }
}))

const ColumnsContainer = styled(Box)({
  display: 'grid',
  gap: COLUMNS_GAP
})

/* eslint-disable @typescript-eslint/naming-convention */
const MobileEventsTrack = styled(Box)({
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

// Matches decentraland-ui2 EventSmallCard's intrinsic maxWidth so the centered
// stack on mobile mirrors the card's natural max width on tablet/desktop.
const MOBILE_CARD_MAX_WIDTH = 430

const MobileEventsPage = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
  flex: '0 0 100%',
  scrollSnapAlign: 'start',
  ['& > *']: {
    width: '100%',
    maxWidth: MOBILE_CARD_MAX_WIDTH
  }
})

export { AllExperiencesSection, ColumnsContainer, MobileEventsPage, MobileEventsTrack, SectionTitle }

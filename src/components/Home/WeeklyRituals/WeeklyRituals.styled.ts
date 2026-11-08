import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const WeeklyRitualsOuter = styled(Box)({
  width: '100%',
  background: 'radial-gradient(ellipse at 110% 50%, rgba(148,37,205,1) 0%, rgba(104,20,155,1) 100%)'
})

const WeeklyRitualsContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(4),
  padding: `${theme.spacing(10)} 0`,
  width: '100%',
  maxWidth: 1920,
  margin: '0 auto',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(6)} 0`
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  fontSize: 48,
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

// The card is a button so it is keyboard-activatable; reset the native chrome and keep the focus ring.
const CardButton = styled('button')(({ theme }) => ({
  display: 'block',
  width: '100%',
  height: '100%',
  padding: 0,
  border: 0,
  background: 'none',
  cursor: 'pointer',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    opacity: 0.95
  },
  '&:active': {
    opacity: 0.85
  },
  '&:focus-visible': {
    outline: `3px solid ${dclColors.neutral.white}`,
    outlineOffset: theme.spacing(-0.5)
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CardImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

const MobileCardImage = styled('img')({
  display: 'block',
  width: '100%',
  maxWidth: 358,
  margin: '0 auto',
  borderRadius: 16,
  objectFit: 'cover'
})

export { CardButton, CardImage, MobileCardImage, SectionTitle, WeeklyRitualsContainer, WeeklyRitualsOuter }

import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

// Full-bleed hero wrapper. Holds the WebGL AnimatedBackground behind a centered
// glass card. paddingTop clears the fixed LandingNavbar (64px mobile / 92px desktop).
const PlayContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(7.5),
  overflow: 'hidden',
  padding: theme.spacing(13, 2.5),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(16, 2.5)
  }
}))

const PlayCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(7.5),
  width: '100%',
  maxWidth: 808,
  padding: theme.spacing(7.5, 10),
  borderRadius: 24,
  border: `1px solid ${dclColors.whiteTransparent.soft}`,
  // Glass fill — no dclColors token for this specific tinted black at 32% alpha.
  backgroundColor: 'rgba(32, 32, 32, 0.32)',
  backdropFilter: 'blur(6px)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WebkitBackdropFilter: 'blur(6px)',
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(4),
    padding: theme.spacing(4, 2.5)
  }
}))

// Mobile layout: no glass card — title + subtitle + a single Ruby store button
// + the "already downloaded" link sit directly on the animated background.
const PlayMobileContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(4),
  width: '100%',
  maxWidth: 420
}))

const PlayTitleGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  width: '100%'
}))

const PlayTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 48,
  lineHeight: 1.167,
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

const PlaySubtitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 32,
  lineHeight: 1.235,
  margin: 0,
  [theme.breakpoints.down('sm')]: {
    fontSize: 22
  }
}))

const PlayCTASection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%'
}))

// Desktop CTAs sit side by side and split the card width evenly (flex: 1), the
// widest the pair can be on a single line inside the 648px card content.
const PlayCTAButtons = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: 24,
  width: '100%'
})

/* eslint-disable @typescript-eslint/naming-convention */
const PlayDownloadButton = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  flex: 1,
  height: 64,
  backgroundColor: dclColors.brand.ruby,
  borderRadius: 16,
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '19.89px',
  color: dclColors.neutral.softWhite,
  textTransform: 'uppercase',
  letterSpacing: '0.61px',
  boxSizing: 'border-box',
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease',
  '&:hover': {
    outlineColor: dclColors.neutral.trueWhite
  },
  '& img': {
    display: 'block'
  }
})

const PlayEpicButton = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  flex: 1,
  height: 64,
  backgroundColor: dclColors.neutral.trueWhite,
  border: `3px solid ${dclColors.neutral.trueWhite}`,
  borderRadius: 16,
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '19.89px',
  color: dclColors.neutral.softBlack2,
  textTransform: 'uppercase',
  letterSpacing: '0.61px',
  boxSizing: 'border-box',
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease',
  '&:hover': {
    outlineColor: dclColors.neutral.trueWhite
  },
  '& img': {
    display: 'block'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const PlayDownloadCounts = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  color: dclColors.neutral.white,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  whiteSpace: 'nowrap'
})

const PlayDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2.625),
  width: '100%',
  padding: theme.spacing(1.5, 0)
}))

const PlayDividerLine = styled(Box)({
  flex: '1 0 0',
  height: 1,
  minWidth: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.3)'
})

const PlayDividerLabel = styled(Typography)({
  color: dclColors.neutral.white,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  whiteSpace: 'nowrap'
})

const PlayBadges = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2.75),
  [theme.breakpoints.down('sm')]: {
    flexWrap: 'wrap'
  }
}))

// Store badges mirror decentraland-ui2's DownloadModal: each official badge SVG
// already paints its own black box + gray border, so the link stays transparent
// and the art renders at its natural width and a fixed 61px height.
const PlayBadgeLink = styled('a')({
  display: 'inline-flex',
  lineHeight: 0,
  borderRadius: 10,
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    outlineColor: dclColors.whiteTransparent.backdrop
  }
})

const PlayBadgeImage = styled('img')({
  height: 61,
  width: 'auto',
  display: 'block'
})

const PlayAlreadyText = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: 6,
  color: dclColors.neutral.white,
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.6
})

const PlayJumpInLink = styled('a')({
  color: dclColors.brand.ruby,
  fontWeight: 500,
  fontSize: 20,
  lineHeight: 1.6,
  textDecoration: 'underline',
  textTransform: 'uppercase',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.8
  }
})

// Secondary note, desktop only: points to the experimental web version.
// typography/h6 — Inter 20px / 500 / 160%.
const PlayExperimentalText = styled(Typography)({
  color: dclColors.neutral.trueWhite,
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.6,
  textAlign: 'center'
})

const PlayExperimentalLink = styled('a')({
  color: dclColors.brand.ruby,
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.6,
  textDecoration: 'underline',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.8
  }
})

export {
  PlayAlreadyText,
  PlayBadgeImage,
  PlayBadgeLink,
  PlayBadges,
  PlayCTAButtons,
  PlayCTASection,
  PlayCard,
  PlayContainer,
  PlayDivider,
  PlayDividerLabel,
  PlayDividerLine,
  PlayDownloadButton,
  PlayDownloadCounts,
  PlayEpicButton,
  PlayExperimentalLink,
  PlayExperimentalText,
  PlayJumpInLink,
  PlayMobileContent,
  PlaySubtitle,
  PlayTitle,
  PlayTitleGroup
}

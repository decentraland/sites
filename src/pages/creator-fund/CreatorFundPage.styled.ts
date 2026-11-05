import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

// Darkens the hero video so the white copy stays readable on its brightest frames.
const CreatorFundOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  background: 'linear-gradient(180deg, rgba(22, 21, 24, 0.35) 0%, rgba(22, 21, 24, 0.7) 100%)'
})

const CreatorFundBadge = styled(Typography)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(4),
  padding: `${theme.spacing(0.75)} ${theme.spacing(2)}`,
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.24)',
  backgroundColor: 'rgba(22, 21, 24, 0.6)',
  backdropFilter: 'blur(8px)',
  color: dclColors.neutral.white,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  [theme.breakpoints.down('sm')]: {
    fontSize: 12
  }
}))

const CreatorFundBadgeDot = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main
}))

const CreatorFundPool = styled('strong')({
  display: 'block',
  fontWeight: 700
})

export { CreatorFundBadge, CreatorFundBadgeDot, CreatorFundOverlay, CreatorFundPool }

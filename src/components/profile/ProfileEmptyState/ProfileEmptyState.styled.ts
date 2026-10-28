import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

// Figma "EmptyMessage" (I355:43604;355:42115): centered column, 20px gap between
// the icon and the text block, 80px vertical breathing room inside the tab panel.
const EmptyStateBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: 20,
  padding: theme.spacing(10, 2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(6, 2)
  }
}))

// Figma "EmptyFavoritesImg" (I355:43604;355:42116): 100×100 box, 4px snow border,
// 24px radius, ~67px glyph centered inside.
const EmptyStateIcon = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 100,
  height: 100,
  borderRadius: 24,
  border: `4px solid ${dclColors.neutral.softWhite}`,
  color: dclColors.neutral.softWhite,
  ['& .MuiSvgIcon-root']: { fontSize: 56 },
  ['& svg']: { width: 56, height: 56 }
})

// Title → subtitle → CTA share a tighter 10px rhythm, offset 10px from the icon
// block (Figma I355:43604;355:42118).
const EmptyStateBody = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  paddingTop: 10
})

// Figma typography/h6: Inter Medium 20, snow, line 1.6.
const EmptyStateTitle = styled(Typography)({
  color: dclColors.neutral.softWhite,
  fontWeight: 500,
  fontSize: 20,
  lineHeight: 1.6,
  maxWidth: 452
})

// Figma typography/body1: Inter Regular 16, snow, line 1.5, ~436 wide.
const EmptyStateSubtitle = styled(Typography)({
  color: dclColors.neutral.softWhite,
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  maxWidth: 436
})

// Figma "PrimaryCTA" / button/medium: primary fill, h46, 16px padding, radius 12,
// uppercase 14 semibold with 0.4 tracking.
const EmptyStateButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  height: 46,
  padding: theme.spacing(0, 2),
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '0.4px',
  lineHeight: '24px',
  textTransform: 'uppercase'
}))

export { EmptyStateBody, EmptyStateBox, EmptyStateButton, EmptyStateIcon, EmptyStateSubtitle, EmptyStateTitle }

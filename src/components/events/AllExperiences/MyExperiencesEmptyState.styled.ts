import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const EmptyPanel = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: 'rgba(179, 47, 255, 0.25)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  justifyContent: 'center',
  minHeight: 320,
  padding: theme.spacing(6, 3),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    minHeight: 240,
    padding: theme.spacing(4, 2)
  }
}))

const EmptyTitle = styled(Typography)({
  color: dclColors.neutral.softWhite,
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.6
})

const EmptyButton = styled(Button)(({ theme }) => ({
  borderColor: dclColors.neutral.softWhite,
  borderRadius: 6,
  color: dclColors.neutral.softWhite,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.46px',
  lineHeight: '24px',
  padding: theme.spacing(1, 3),
  textTransform: 'uppercase',
  ['&:hover']: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: dclColors.neutral.softWhite
  }
}))

export { EmptyButton, EmptyPanel, EmptyTitle }

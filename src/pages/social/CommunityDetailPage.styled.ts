import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

// Page-specific brand gradient — these violet shades are not part of dclColors
// because they're a deliberate one-off for the Community detail surface, not a
// reusable token. Keep them named as constants so future readers know the
// hardcoded values are an intentional design call, not an oversight.
const COMMUNITY_GRADIENT_START = '#7434B1'
const COMMUNITY_GRADIENT_MID = '#481C6C'
const COMMUNITY_GRADIENT_END = '#2B1040'

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: 64,
  background: `radial-gradient(103.89% 95.21% at 95.21% 9.85%, ${COMMUNITY_GRADIENT_START} 0%, ${COMMUNITY_GRADIENT_MID} 37.11%, ${COMMUNITY_GRADIENT_END} 100%)`,
  [theme.breakpoints.up('md')]: { paddingTop: 96 }
}))

const InitialLoader = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh'
})

const NotFoundContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  minHeight: '60vh',
  padding: theme.spacing(4)
}))

const NotFoundTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h5.fontSize,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  textAlign: 'center'
}))

const NotFoundDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 400,
  color: dclColors.neutral.gray3,
  textAlign: 'center'
}))

export { InitialLoader, NotFoundContainer, NotFoundDescription, NotFoundTitle, PageContainer }

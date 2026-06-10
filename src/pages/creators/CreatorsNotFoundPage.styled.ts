import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const NotFoundContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  textAlign: 'center',
  padding: theme.spacing(12, 2),
  color: dclColors.neutral.softWhite
}))

const NotFoundTitle = styled(Typography)({
  fontSize: 26,
  fontWeight: 700
})

const NotFoundDescription = styled(Typography)({
  fontSize: 15,
  color: dclColors.neutral.gray3,
  maxWidth: 480
})

export { NotFoundContainer, NotFoundDescription, NotFoundTitle }

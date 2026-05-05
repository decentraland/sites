import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const FieldWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5)
}))

const FieldLabel = styled(Typography)(({ theme }) => ({
  ...theme.typography.h5,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const FieldRequiredMark = styled('span')(({ theme }) => ({
  color: theme.palette.error.main
}))

const FieldOptionalMark = styled('span')({
  color: dclColors.neutral.gray3
})

const FieldHelper = styled(Typography)(({ theme }) => ({
  ...theme.typography.body2,
  color: dclColors.neutral.gray3
}))

const FieldError = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.error.main
}))

const FieldInputGroup = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '3px'
})

const FieldInputHint = styled(Typography)({
  fontSize: 12,
  color: dclColors.neutral.gray3,
  marginLeft: 14,
  marginRight: 14
})

export { FieldError, FieldHelper, FieldInputGroup, FieldInputHint, FieldLabel, FieldOptionalMark, FieldRequiredMark, FieldWrapper }

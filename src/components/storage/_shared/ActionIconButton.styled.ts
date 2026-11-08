import { IconButton, dclColors, styled } from 'decentraland-ui2'

const ActionIconButton = styled(IconButton)(({ theme }) => ({
  color: dclColors.neutral.gray3,
  ['&:hover, &:focus-visible']: {
    color: theme.palette.text.primary
  },
  ['&:active']: {
    opacity: 0.8
  },
  ['&:disabled']: {
    opacity: 0.4
  }
}))

export { ActionIconButton }

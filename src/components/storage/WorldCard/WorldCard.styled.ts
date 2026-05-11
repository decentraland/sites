import { Box, styled } from 'decentraland-ui2'

const CardLabel = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 4
})

const MenuDivider = styled('span')(({ theme }) => ({
  width: 1,
  alignSelf: 'stretch',
  backgroundColor: theme.palette.divider,
  marginLeft: 4,
  marginRight: 4
}))

export { CardLabel, MenuDivider }

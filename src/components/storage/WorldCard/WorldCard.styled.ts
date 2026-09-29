import { styled } from 'decentraland-ui2'

const MenuDivider = styled('span')(({ theme }) => ({
  width: 1,
  alignSelf: 'stretch',
  backgroundColor: theme.palette.divider,
  marginLeft: 4,
  marginRight: 4
}))

export { MenuDivider }

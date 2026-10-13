import { TableCell, styled } from 'decentraland-ui2'

const RowActionsCell = styled(TableCell)({
  whiteSpace: 'nowrap',
  opacity: 0,
  ['tr:hover > &, tr:focus-within > &']: {
    opacity: 1
  },
  ['@media (hover: none)']: {
    opacity: 1
  }
})

export { RowActionsCell }

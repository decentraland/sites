import { Box, TableCell, styled } from 'decentraland-ui2'

const RowActionsCell = styled(TableCell)({
  whiteSpace: 'nowrap',
  opacity: 0,
  ['tr:hover > &, tr:has(:focus-visible) > &']: {
    opacity: 1
  },
  ['@media (hover: none)']: {
    opacity: 1
  }
})

const BulkActionsRow = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center'
})

export { BulkActionsRow, RowActionsCell }

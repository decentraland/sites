import { Box, Menu, MenuItem, styled } from 'decentraland-ui2'

const DropdownItem = styled(MenuItem)(({ theme }) => ({
  ...theme.typography.body2,
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  color: theme.palette.text.primary,
  ['&.Mui-selected']: { color: theme.palette.primary.main },
  ['&:hover']: { backgroundColor: theme.palette.action.hover },
  ['&:active']: { backgroundColor: theme.palette.action.selected },
  ['&.Mui-disabled']: { color: theme.palette.text.disabled },
  ['&.Mui-focusVisible']: { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 }
}))

const DropdownList = styled(Menu)(({ theme }) => ({
  ['& .MuiPaper-root']: {
    minWidth: theme.spacing(31.25),
    maxHeight: theme.spacing(25),
    marginTop: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.down('sm')]: { minWidth: theme.spacing(25), maxWidth: '90vw' }
  }
}))

const SelectorContainer = styled(Box)({ position: 'relative', flex: 1 })

export { DropdownItem, DropdownList, SelectorContainer }

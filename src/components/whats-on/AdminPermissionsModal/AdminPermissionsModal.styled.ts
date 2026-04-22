import { Box, Dialog, styled } from 'decentraland-ui2'

const Footer = styled(Box)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  '& > *': { flex: 1 }
}))

const PermissionRow = styled(Box)(({ theme }) => ({
  alignItems: 'flex-start',
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  padding: theme.spacing(2, 0)
}))

const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(3),
    color: theme.palette.text.primary,
    maxWidth: 621,
    width: '100%'
  }
}))

export { Footer, PermissionRow, StyledDialog }

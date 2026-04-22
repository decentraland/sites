import { Avatar, Box, TableRow, styled } from 'decentraland-ui2'

const Header = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3)
}))

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  paddingTop: theme.spacing(8),
  [theme.breakpoints.up('md')]: {
    paddingTop: theme.spacing(12)
  }
}))

const UserAvatar = styled(Avatar)(({ theme }) => ({
  display: 'inline-flex',
  marginRight: theme.spacing(1),
  verticalAlign: 'middle'
}))

const ClickableRow = styled(TableRow)({
  cursor: 'pointer'
})

export { ClickableRow, Header, PageContainer, UserAvatar }

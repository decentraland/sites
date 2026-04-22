import { Avatar, Box, TableRow, Typography, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(({ theme }) => ({
  background: 'radial-gradient(61.64% 109.58% at 50% 54.49%, #A042CD 0%, #270537 100%)',
  color: theme.palette.common.white,
  minHeight: '100vh',
  padding: theme.spacing(5, 8),
  paddingTop: theme.spacing(20),
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(5, 4),
    paddingTop: theme.spacing(20)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(5, 3),
    paddingTop: theme.spacing(18)
  },
  [theme.breakpoints.down('sm')]: {
    background: '#1A0A2E',
    padding: theme.spacing(3, 2),
    paddingTop: theme.spacing(18)
  }
}))

const PageTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: theme.typography.h4.fontSize,
  fontWeight: 600,
  marginBottom: theme.spacing(3)
})) as typeof Typography

const Header = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3)
}))

const UserAvatar = styled(Avatar)(({ theme }) => ({
  display: 'inline-flex',
  marginRight: theme.spacing(1),
  verticalAlign: 'middle'
}))

const ClickableRow = styled(TableRow)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  cursor: 'pointer',
  '&:nth-of-type(odd)': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  '&:nth-of-type(even)': {
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  '& > td': {
    color: theme.palette.common.white,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  }
}))

const TableWrapper = styled(Box)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  '& .MuiTableCell-head': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    color: theme.palette.common.white,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    borderBottomColor: 'rgba(255, 255, 255, 0.12)'
  },
  '& .MuiTablePagination-root': {
    color: theme.palette.common.white
  },
  '& .MuiTablePagination-selectIcon, & .MuiTablePagination-actions button': {
    color: theme.palette.common.white
  }
}))

export { ClickableRow, Header, PageContainer, PageTitle, TableWrapper, UserAvatar }

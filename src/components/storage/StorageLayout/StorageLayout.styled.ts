import { Box, ButtonBase, styled } from 'decentraland-ui2'

const StoragePageContainer = styled(Box)(({ theme }) => ({
  paddingTop: 64,
  paddingInline: theme.spacing(2),
  paddingBottom: theme.spacing(6),
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    paddingTop: 96,
    paddingInline: theme.spacing(4)
  }
}))

const StorageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}))

const BackButton = styled(ButtonBase)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  alignSelf: 'flex-start',
  color: theme.palette.text.secondary,
  paddingInline: theme.spacing(1),
  paddingBlock: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius
}))

const ScopeRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap'
}))

const ScopeChip = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.action.hover
}))

const StorageTabsRoot = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`
}))

export { BackButton, ScopeChip, ScopeRow, StorageHeader, StoragePageContainer, StorageTabsRoot }

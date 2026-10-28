import { Alert, Box, styled } from 'decentraland-ui2'

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(2)
}))

const SectionActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1)
}))

const ExportAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}))

export { ExportAlert, SectionActions, SectionHeader }

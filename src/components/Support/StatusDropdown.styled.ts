import { Box, Button, MenuItem, Typography, styled } from 'decentraland-ui2'

const StatusContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center'
})

const StatusGlobalIcon = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginRight: 8
})

const StatusHeaderBar = styled(Box)<{ statusColor?: string }>(({ statusColor }) => ({
  backgroundColor:
    statusColor === 'green' ? '#34CE76' : statusColor === 'orange' ? '#FEA217' : statusColor === 'red' ? '#FF2D55' : '#1f2937',
  color: '#fff',
  padding: '10px 16px',
  fontWeight: 'bold',
  borderRadius: '4px 4px 0 0'
}))

const StatusItem = styled(MenuItem)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  pointerEvents: 'none'
})

const StatusMenuButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  textTransform: 'none',
  fontSize: 14,
  fontWeight: 600
}))

const StatusServiceName = styled(Typography)({
  fontSize: 14,
  marginLeft: 8
})

const StatusViewDetails = styled(Box)({
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& a': {
    color: '#9ca3af',
    textDecoration: 'none',
    fontSize: 14,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:hover': {
      textDecoration: 'underline'
    }
  }
})

export { StatusContainer, StatusGlobalIcon, StatusHeaderBar, StatusItem, StatusMenuButton, StatusServiceName, StatusViewDetails }

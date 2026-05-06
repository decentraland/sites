import { Typography, styled } from 'decentraland-ui2'

const SidebarContainer = styled('div')({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  color: 'white',
  overflow: 'hidden'
})

const SidebarHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 30,
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    padding: 16
  }
}))

const SidebarTitle = styled(Typography)(() => ({
  color: 'white',
  fontWeight: 500,
  fontSize: 24,
  display: 'flex',
  alignItems: 'center',
  gap: 8
}))

const CloseButton = styled('button')({
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.7)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 4,
  transition: 'color 0.2s ease',
  '&:hover': {
    color: 'white'
  },
  '& svg': {
    fontSize: 20
  }
})

const SidebarContent = styled('div')(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: '20px 30px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  '&::-webkit-scrollbar': {
    width: 6
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)'
    }
  },
  [theme.breakpoints.down('sm')]: {
    padding: 12
  }
}))

const Section = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: 12
})

const SectionHeader = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 4px'
})

const SectionTitle = styled(Typography)(() => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5
}))

const SectionCount = styled('span')({
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: 12,
  fontWeight: 600
})

const SectionCard = styled('div')({
  background: 'rgba(236, 235, 237, 0.2)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 0
})

const Divider = styled('div')({
  height: 1,
  background: 'rgba(255, 255, 255, 0.1)',
  margin: '12px 0'
})

const ParticipantItem = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 8,
  borderRadius: 8,
  transition: 'background 0.2s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.05)'
  }
})

const ParticipantAvatar = styled('div')<{ $color?: string }>(({ $color }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: $color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden',
  position: 'relative'
}))

const ParticipantAvatarImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  position: 'relative',
  zIndex: 1
})

const ParticipantInfo = styled('div')({
  flex: 1,
  minWidth: 0
})

const ParticipantName = styled('div')({
  color: 'white',
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const ParticipantStatus = styled('div')<{ $isStreaming?: boolean }>(({ $isStreaming }) => ({
  color: $isStreaming ? '#00ff88' : 'rgba(255, 255, 255, 0.5)',
  fontSize: 11,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  '&::before': {
    content: '""',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: $isStreaming ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'
  }
}))

const EmptyState = styled('div')({
  textAlign: 'center',
  padding: 24,
  color: 'rgba(255, 255, 255, 0.4)',
  fontSize: 13
})

export {
  CloseButton,
  Divider,
  EmptyState,
  ParticipantAvatar,
  ParticipantAvatarImage,
  ParticipantInfo,
  ParticipantItem,
  ParticipantName,
  ParticipantStatus,
  Section,
  SectionCard,
  SectionCount,
  SectionHeader,
  SectionTitle,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarTitle
}

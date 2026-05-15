import { Box, Typography, styled } from 'decentraland-ui2'

const CommunityRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: theme.spacing(2)
}))

const CommunityCard = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  borderRadius: 12,
  background: 'rgba(0, 0, 0, 0.20)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  color: 'inherit',
  textDecoration: 'none',
  transition: 'background 150ms ease, border-color 150ms ease',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.30)',
    borderColor: 'rgba(255, 255, 255, 0.16)'
  }
}))

const CommunityThumb = styled(Box)({
  width: 56,
  height: 56,
  flexShrink: 0,
  borderRadius: 12,
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const CommunityThumbImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover'
})

const CommunityFallback = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const CommunityCardBody = styled(Box)({
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2
})

const CommunityName = styled(Typography)({
  fontWeight: 600,
  fontSize: 16,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const CommunityMembers = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 13
}))

const LoadingRow = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-start',
  padding: '24px 0'
})

const EmptyBio = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontStyle: 'italic'
}))

export {
  CommunityCard,
  CommunityCardBody,
  CommunityFallback,
  CommunityMembers,
  CommunityName,
  CommunityRow,
  CommunityThumb,
  CommunityThumbImage,
  EmptyBio,
  LoadingRow
}

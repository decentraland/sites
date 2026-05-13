import { Box, Typography, styled } from 'decentraland-ui2'

const ReferralRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(4)
}))

const InviteCard = styled(Box)(({ theme }) => ({
  borderRadius: 24,
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, rgba(255,45,85,0.18) 0%, rgba(46,217,255,0.12) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  color: theme.palette.text.primary,
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3)
  }
}))

const CodeRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap'
}))

const CodePill = styled(Box)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  letterSpacing: 0.5,
  padding: theme.spacing(1, 2),
  borderRadius: 12,
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: theme.palette.text.primary
}))

const StatsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  flexWrap: 'wrap'
}))

const StatItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25)
}))

const StatNumber = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 28,
  lineHeight: 1.2
})

const StatLabel = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 13,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: 1
}))

const RewardsSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const RewardsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))'
  }
}))

const RewardCard = styled(Box)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  color: theme.palette.text.primary
}))

const RewardImage = styled('img')({
  width: '100%',
  aspectRatio: '1 / 1',
  objectFit: 'contain',
  borderRadius: 12
})

const RewardTier = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1,
  color: theme.palette.primary.main,
  textTransform: 'uppercase'
}))

const RewardTitle = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 14
})

export {
  CodePill,
  CodeRow,
  InviteCard,
  ReferralRoot,
  RewardCard,
  RewardImage,
  RewardTier,
  RewardTitle,
  RewardsGrid,
  RewardsSection,
  StatItem,
  StatLabel,
  StatNumber,
  StatsRow
}

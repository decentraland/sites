import { Box, Skeleton, Typography, dclColors, styled } from 'decentraland-ui2'

const UpcomingContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(10, 8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(6, 2),
    alignItems: 'center'
  }
}))

const SectionTitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 700,
  textAlign: 'left',
  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
  width: '100%'
})

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: theme.spacing(3),
  width: '100%'
}))

/* --- Horizontal Event Card (430×140) --- */

const EventCardRoot = styled('a')(({ theme }) => ({
  display: 'flex',
  width: 430,
  height: 140,
  borderRadius: 16,
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  transition: 'box-shadow 300ms ease, transform 300ms ease',
  flexShrink: 0,
  cursor: 'pointer',
  [theme.breakpoints.up('sm')]: {
    '&:hover': {
      boxShadow: '0px 0px 20px 6px rgba(221, 86, 255, 0.37)',
      transform: 'translateY(-2px)'
    }
  },
  [theme.breakpoints.down('xs')]: {
    width: '100%',
    maxWidth: 430
  }
}))

const CardImage = styled('div')({
  width: 180,
  minWidth: 180,
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.06)'
})

const CardBody = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  overflow: 'hidden',
  flex: 1,
  minWidth: 0
}))

const CardTitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  fontSize: '1rem',
  fontWeight: 600,
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-word'
})

const AuthorRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0
})

const AuthorAvatar = styled('div')({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  flexShrink: 0
})

const AuthorText = styled(Typography)({
  color: 'rgba(240, 240, 240, 0.7)',
  fontSize: '0.8125rem',
  lineHeight: 1.4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '& strong': {
    color: dclColors.neutral.white,
    fontWeight: 600
  }
})

/* --- Skeleton card --- */

const SkeletonCardRoot = styled(Box)({
  display: 'flex',
  width: 430,
  height: 140,
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  flexShrink: 0
})

const SkeletonImage = styled(Skeleton)({
  width: 180,
  minWidth: 180,
  height: '100%',
  transform: 'none',
  backgroundColor: 'rgba(255, 255, 255, 0.06)'
})

const SkeletonBody = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(2),
  gap: theme.spacing(1),
  flex: 1
}))

const SkeletonTitle = styled(Skeleton)({
  width: '85%',
  height: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 4
})

const SkeletonTitleShort = styled(Skeleton)({
  width: '55%',
  height: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 4
})

const SkeletonAuthorRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8
})

const SkeletonAvatar = styled(Skeleton)({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  transform: 'none'
})

const SkeletonAuthorText = styled(Skeleton)({
  width: 100,
  height: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 4
})

export {
  AuthorAvatar,
  AuthorRow,
  AuthorText,
  CardBody,
  CardImage,
  CardTitle,
  CardsGrid,
  EventCardRoot,
  SectionTitle,
  SkeletonAuthorRow,
  SkeletonAuthorText,
  SkeletonAvatar,
  SkeletonBody,
  SkeletonCardRoot,
  SkeletonImage,
  SkeletonTitle,
  SkeletonTitleShort,
  UpcomingContainer
}

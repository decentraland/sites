import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../components/blog/utils/safeCssUrl'

const EventList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5)
}))

const EventItem = styled('a')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: 'rgba(252, 252, 252, 0.02)',
  textDecoration: 'none',
  color: dclColors.neutral.softWhite,
  transition: 'border-color 0.2s ease, transform 0.2s ease',
  ['&:hover']: { borderColor: dclColors.whiteTransparent.blurry, transform: 'translateY(-2px)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

interface ThumbProps {
  $image?: string
}

const EventThumb = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<ThumbProps>(({ theme, $image }) => ({
  flexShrink: 0,
  width: 92,
  height: 64,
  borderRadius: theme.spacing(1),
  backgroundColor: dclColors.neutral.softBlack1,
  backgroundImage: $image ? `url("${safeCssUrl($image)}")` : 'linear-gradient(135deg, #7434B1 0%, #2B1040 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

const EventInfo = styled(Box)(({ theme }) => ({ display: 'flex', flexDirection: 'column', gap: theme.spacing(0.25), minWidth: 0, flex: 1 }))

const EventName = styled(Typography)({ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })

const EventMeta = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  color: dclColors.neutral.gray3,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap'
}))

const LiveTag = styled('span')(({ theme }) => ({
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: theme.spacing(0.125, 0.75),
  borderRadius: 999,
  color: dclColors.neutral.softWhite,
  backgroundColor: theme.palette.primary.main
}))

export { EventInfo, EventItem, EventList, EventMeta, EventName, EventThumb, LiveTag }

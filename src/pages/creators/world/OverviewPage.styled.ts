import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../../components/blog/utils/safeCssUrl'

// Same dark backdrop surface as the other tab cards (SectionCard) so the
// Overview reads consistently with Preview / Events / Storage, etc. — a clean
// separated layout (framed thumbnail + info beside it, no text overlay).
const OverviewCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.backdrop,
  boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: { padding: theme.spacing(4) }
}))

const HeroRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  [theme.breakpoints.up('md')]: { flexDirection: 'row', alignItems: 'stretch' }
}))

interface ThumbProps {
  $image?: string
}

const Thumb = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<ThumbProps>(({ theme, $image }) => ({
  flexShrink: 0,
  width: '100%',
  aspectRatio: '16 / 10',
  borderRadius: theme.spacing(1.5),
  backgroundColor: dclColors.neutral.softBlack1,
  backgroundImage: $image ? `url("${safeCssUrl($image)}")` : 'linear-gradient(135deg, #7434B1 0%, #2B1040 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow: '0px 4px 16px 0px rgba(0, 0, 0, 0.28)',
  [theme.breakpoints.up('md')]: { width: 380, aspectRatio: 'auto' }
}))

const HeroInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  minWidth: 0,
  flex: 1
}))

const HeroTitle = styled(Typography)({
  fontSize: 32,
  fontWeight: 600,
  lineHeight: 1.24,
  color: '#FCFCFC',
  wordBreak: 'break-word'
})

const HeroMeta = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(2)
}))

const HeroMetaItem = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  fontSize: 14,
  color: '#FCFCFC',
  ['& svg']: { fontSize: 18, color: 'rgba(252, 252, 252, 0.7)' }
}))

const HeroDescription = styled(Typography)({
  fontSize: 14,
  lineHeight: 1.6,
  color: dclColors.neutral.softWhite,
  whiteSpace: 'pre-wrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  /* eslint-disable @typescript-eslint/naming-convention */
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical'
  /* eslint-enable @typescript-eslint/naming-convention */
})

const HeroActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(0.5)
}))

// Hairline between the identity row and the deployment details.
const Divider = styled(Box)({
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.15)'
})

const ContentLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#A09BA8',
  marginBottom: theme.spacing(2)
}))

export { ContentLabel, Divider, HeroActions, HeroDescription, HeroInfo, HeroMeta, HeroMetaItem, HeroRow, HeroTitle, OverviewCard, Thumb }

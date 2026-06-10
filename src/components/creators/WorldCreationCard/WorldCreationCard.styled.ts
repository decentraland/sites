import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { safeCssUrl } from '../../blog/utils/safeCssUrl'

// Mirrors the design-system card idiom (CatchTheVibe / WhatsOn): 16px radius,
// soft resting shadow, hover lift + elevation, subtle white border.
const Card = styled('button')(({ theme }) => ({
  appearance: 'none',
  textAlign: 'left',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.backdrop,
  color: dclColors.neutral.softWhite,
  boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  ['&:hover']: {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 20px 0 rgba(0, 0, 0, 0.12)',
    borderColor: dclColors.whiteTransparent.blurry
  },
  ['&:active']: { transform: 'translateY(-2px)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

interface ThumbProps {
  $image?: string
}

const Thumb = styled(Box, { shouldForwardProp: prop => prop !== '$image' })<ThumbProps>(({ $image }) => ({
  aspectRatio: '16 / 10',
  width: '100%',
  backgroundColor: dclColors.neutral.softBlack1,
  backgroundImage: $image ? `url("${safeCssUrl($image)}")` : 'linear-gradient(135deg, #7434B1 0%, #2B1040 100%)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative'
}))

const LiveBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.25, 1),
  borderRadius: 999,
  backgroundColor: dclColors.blackTransparent.blurry,
  backdropFilter: 'blur(8px)',
  fontSize: 12,
  fontWeight: 700,
  ['& svg']: { fontSize: 14 }
}))

const Body = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2, 2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}))

const Name = styled(Typography)({
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

interface RoleChipProps {
  $owner?: boolean
}

const RoleChip = styled('span', { shouldForwardProp: prop => prop !== '$owner' })<RoleChipProps>(({ theme, $owner }) => ({
  alignSelf: 'flex-start',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: theme.spacing(0.25, 1),
  borderRadius: 999,
  color: $owner ? dclColors.neutral.softWhite : dclColors.neutral.gray3,
  backgroundColor: $owner ? theme.palette.primary.main : dclColors.whiteTransparent.subtle
}))

export { Body, Card, LiveBadge, Name, RoleChip, Thumb }

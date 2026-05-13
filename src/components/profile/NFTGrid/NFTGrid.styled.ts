import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const RARITY_FALLBACK = 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'

const RARITY_BG: Record<string, string> = {
  common: dclColors.gradient.common,
  uncommon: dclColors.gradient.uncommon,
  rare: dclColors.gradient.rare,
  epic: dclColors.gradient.epic,
  legendary: dclColors.gradient.legendary,
  exotic: dclColors.gradient.exotic,
  mythic: dclColors.gradient.mythic,
  unique: dclColors.gradient.unique
}

function resolveRarityBg(rarity: string | undefined): string {
  if (!rarity) return RARITY_FALLBACK
  return RARITY_BG[rarity.toLowerCase()] ?? RARITY_FALLBACK
}

const GridRoot = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: theme.spacing(1.5)
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const Card = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(0, 0, 0, 0.35)',
  cursor: 'pointer',
  transition: 'transform 150ms ease, border-color 150ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: theme.palette.primary.main
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const Thumb = styled(Box, {
  shouldForwardProp: prop => prop !== '$rarity'
})<{ $rarity?: string }>(({ $rarity }) => ({
  width: '100%',
  aspectRatio: '1 / 1',
  position: 'relative',
  overflow: 'hidden',
  background: resolveRarityBg($rarity)
}))

const ThumbImage = styled('img')({
  position: 'absolute',
  inset: '10%',
  width: '80%',
  height: '80%',
  objectFit: 'contain'
})

const Meta = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  color: theme.palette.text.primary
}))

const Title = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: 1.4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const Subtitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  fontSize: 12,
  color: theme.palette.text.secondary,
  textTransform: 'capitalize'
}))

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6, 2),
  gap: theme.spacing(1),
  color: theme.palette.text.disabled,
  textAlign: 'center',
  minHeight: 240
}))

const LoadingRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4, 0)
}))

export { Card, EmptyState, GridRoot, LoadingRow, Meta, Subtitle, Thumb, ThumbImage, Title, resolveRarityBg }

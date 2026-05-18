import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const Card = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  backgroundColor: dclColors.blackTransparent.backdrop,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  cursor: 'pointer',
  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  ['&:hover']: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
    borderColor: dclColors.whiteTransparent.blurry
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
}))

const Cover = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  backgroundColor: dclColors.neutral.softBlack1
})

const CoverImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  pointerEvents: 'none',
  userSelect: 'none'
})

const CoverFallback = styled(Box)({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #4a2475 0%, #1a0b2e 100%)'
})

const FallbackDisc = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: dclColors.neutral.softWhite,
  background: theme.palette.primary.main,
  textTransform: 'uppercase',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
}))

const Body = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.5, 1.75),
  backgroundColor: dclColors.blackTransparent.blurry,
  flex: 1,
  minHeight: 96
}))

const Title = styled(Typography)({
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.35,
  color: dclColors.neutral.softWhite,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const Description = styled(Typography)({
  fontSize: 13,
  color: dclColors.neutral.gray3,
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2, // eslint-disable-line @typescript-eslint/naming-convention
  WebkitBoxOrient: 'vertical', // eslint-disable-line @typescript-eslint/naming-convention
  overflow: 'hidden'
})

const Meta = styled(Typography)({
  fontSize: 11,
  color: dclColors.neutral.gray3,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  marginTop: 'auto'
})

export { Body, Card, Cover, CoverFallback, CoverImage, Description, FallbackDisc, Meta, Title }

import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 322:59967 — 5 cards per row at desktop, vertical cards with 1:1
// thumbnail. The breakpoints scale down gracefully on smaller viewports;
// phones show one full-width card per row (Figma mobile communities 294:50475).
const CommunityRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))'
  },
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))'
  }
}))

const CommunityCard = styled('a')(() => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: 'inherit',
  textDecoration: 'none',
  overflow: 'hidden',
  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    boxShadow: '0px 4px 25px 0px rgba(255, 255, 255, 0.15)'
  },
  // Keyboard focus uses a soft white ring instead of the brand primary (the
  // red outline read as an error state on the dark gradient).
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: '2px solid rgba(255, 255, 255, 0.45)',
    outlineOffset: 2
  }
}))

const CommunityThumb = styled(Box)({
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  background: 'rgba(255, 255, 255, 0.06)'
})

const CommunityThumbImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

const CommunityFallback = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 56 }
}))

const MemberCountBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.25),
  right: theme.spacing(1.25),
  minWidth: 36,
  height: 24,
  padding: theme.spacing(0, 1),
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  borderRadius: 999,
  background: 'rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(8px)',
  color: '#FCFCFC',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 14 }
}))

const OwnerChip = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.25),
  left: theme.spacing(1.25),
  height: 22,
  padding: theme.spacing(0, 1.25),
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  background: '#FF2D55',
  color: '#FCFCFC',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase'
}))

const CommunityCardBody = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  padding: theme.spacing(1.5, 1.75, 1.75, 1.75),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.25),
  minWidth: 0
}))

const CommunityName = styled(Typography)({
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.25,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  /* eslint-disable @typescript-eslint/naming-convention */
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
  /* eslint-enable @typescript-eslint/naming-convention */
})

const CommunityActionRow = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const CommunityActionButton = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0, 1.5),
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.25)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#FCFCFC',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 16 }
}))

const CommunityShareButton = styled('button')(({ theme }) => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.25)',
  background: 'rgba(255, 255, 255, 0.06)',
  color: '#FCFCFC',
  cursor: 'pointer',
  transition: 'background 150ms ease, border-color 150ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 16 }
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

const CommunityCountLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 13,
  marginBottom: theme.spacing(2)
}))

export {
  CommunityActionButton,
  CommunityActionRow,
  CommunityCard,
  CommunityCardBody,
  CommunityCountLabel,
  CommunityFallback,
  CommunityName,
  CommunityRow,
  CommunityShareButton,
  CommunityThumb,
  CommunityThumbImage,
  EmptyBio,
  LoadingRow,
  MemberCountBadge,
  OwnerChip
}

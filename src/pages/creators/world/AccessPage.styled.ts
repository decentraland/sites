import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const PermBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.25),
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: 'rgba(252, 252, 252, 0.02)'
}))

const PermHeading = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const PermName = styled(Typography)(({ theme }) => ({
  fontSize: 16,
  fontWeight: 700,
  ['& svg']: { fontSize: 18, verticalAlign: 'middle', marginRight: theme.spacing(0.75), color: dclColors.neutral.gray3 }
}))

const PermType = styled('span')(({ theme }) => ({
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: theme.spacing(0.25, 1),
  borderRadius: 999,
  color: dclColors.neutral.gray3,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`
}))

// Icon-only remove keeps the wallet rows uncluttered.
const RemoveButton = styled('button')(({ theme }) => ({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  color: dclColors.neutral.gray3,
  backgroundColor: 'transparent',
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  transition: 'color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
  ['& svg']: { fontSize: 18 },
  ['&:hover']: { color: theme.palette.error.main, borderColor: theme.palette.error.main, backgroundColor: 'rgba(255, 45, 85, 0.08)' },
  ['&:disabled']: { opacity: 0.4, cursor: 'default' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

const LearnMoreLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  alignSelf: 'flex-start',
  fontSize: 13,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  textDecoration: 'none',
  ['& svg']: { fontSize: 16 },
  ['&:hover']: { textDecoration: 'underline' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

export { LearnMoreLink, PermBlock, PermHeading, PermName, PermType, RemoveButton }

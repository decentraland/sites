import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const Fields = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const Field = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}))

const FieldLabel = styled(Typography)({
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: dclColors.neutral.gray3
})

const ValueRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'stretch'
}))

const ValueBox = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1.5),
  height: 42,
  borderRadius: theme.spacing(1.25),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: 'rgba(252, 252, 252, 0.03)',
  fontFamily: 'monospace',
  fontSize: 13,
  color: dclColors.neutral.softWhite,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis'
}))

const CopyButton = styled('button')(({ theme }) => ({
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  height: 42,
  paddingInline: theme.spacing(1.5),
  borderRadius: theme.spacing(1.25),
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  backgroundColor: 'transparent',
  border: `1px solid ${dclColors.whiteTransparent.blurry}`,
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  ['& svg']: { fontSize: 16 },
  ['&:hover']: { backgroundColor: 'rgba(252, 252, 252, 0.08)', borderColor: dclColors.neutral.softWhite },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

const Expiry = styled(Typography)({
  fontSize: 13,
  color: dclColors.neutral.gray3,
  ['& strong']: { color: dclColors.neutral.softWhite, fontWeight: 600 }
})

const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1)
}))

export { ActionsRow, CopyButton, Expiry, Field, FieldLabel, Fields, ValueBox, ValueRow }

import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

// Shared layout for the address-list management tabs (Bans, Scene Admins): an
// "add" row (input + action) plus a list of entries (name + address + action).
const AddRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  alignItems: 'stretch'
}))

// Matches the sites/ canonical input (the /discover SearchField): a filled
// subtle surface with a transparent outline that warms to `blurry` on hover and
// the primary accent on focus. Every "add" field across the creators dashboard
// (Bans, Scene admins, Access) renders through this one styled input.
const EntryInput = styled('input')(({ theme }) => ({
  flex: 1,
  minWidth: 220,
  height: 44,
  padding: theme.spacing(0, 2),
  borderRadius: 10,
  border: '1px solid transparent',
  backgroundColor: dclColors.whiteTransparent.subtle,
  color: dclColors.neutral.softWhite,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  ['&::placeholder']: { color: dclColors.neutral.gray3, opacity: 1 },
  ['&:hover']: { borderColor: dclColors.whiteTransparent.blurry },
  ['&:focus']: { borderColor: theme.palette.primary.main }
}))

const EntryList = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}))

const EntryRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: 'rgba(252, 252, 252, 0.02)'
}))

const EntryIdentity = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),
  minWidth: 0,
  flex: 1
}))

const EntryName = styled(Typography)({ fontSize: 14, fontWeight: 600, color: dclColors.neutral.softWhite })

const EntryAddress = styled(Typography)({
  fontSize: 12,
  fontFamily: 'monospace',
  color: dclColors.neutral.gray3,
  wordBreak: 'break-all'
})

const EntryTag = styled('span')(({ theme }) => ({
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: theme.spacing(0.25, 1),
  borderRadius: 999,
  color: dclColors.neutral.gray3,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`
}))

export { AddRow, EntryAddress, EntryIdentity, EntryInput, EntryList, EntryName, EntryRow, EntryTag }

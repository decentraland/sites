import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const MINI_AVATAR_SIZE = 24
const MINI_AVATAR_OVERLAP = 8

// Trigger — overlapping avatar stack + "N people" label. Replaces the simple
// people-count pill on the watcher card. Clicking opens a popover with the
// full list. Pinned top-right of the video area.
const StackTrigger = styled('button')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  height: 32,
  padding: theme.spacing(0, 1.25, 0, 0.5),
  borderRadius: 999,
  border: 'none',
  backgroundColor: dclColors.blackTransparent.backdrop,
  color: dclColors.neutral.softWhite,
  fontFamily: 'inherit',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  zIndex: 2,
  transition: 'background-color 150ms ease',
  ['&:hover, &:focus-visible']: {
    backgroundColor: dclColors.neutral.softBlack1,
    outline: 'none'
  },
  ['&:focus-visible']: {
    boxShadow: `0 0 0 2px ${dclColors.neutral.softWhite}`
  }
}))

const AvatarStack = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center'
})

interface StackSlotProps {
  $index: number
}

const StackSlot = styled(Box, { shouldForwardProp: prop => prop !== '$index' })<StackSlotProps>(({ $index }) => ({
  width: MINI_AVATAR_SIZE,
  height: MINI_AVATAR_SIZE,
  borderRadius: '50%',
  overflow: 'hidden',
  marginLeft: $index === 0 ? 0 : -MINI_AVATAR_OVERLAP,
  border: `2px solid ${dclColors.neutral.softBlack2}`,
  background: dclColors.neutral.softBlack1,
  flexShrink: 0,
  zIndex: 10 - $index,
  position: 'relative'
}))

const OverflowDisc = styled(Box)(({ theme }) => ({
  width: MINI_AVATAR_SIZE,
  height: MINI_AVATAR_SIZE,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: -MINI_AVATAR_OVERLAP,
  border: `2px solid ${dclColors.neutral.softBlack2}`,
  backgroundColor: theme.palette.primary.main,
  color: dclColors.neutral.softWhite,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.02em'
}))

const StackCount = styled('span')({
  whiteSpace: 'nowrap'
})

// Popover — full participant list. Compact so it doesn't overlap the chat.
const PopoverShell = styled(Box)(({ theme }) => ({
  width: 280,
  maxHeight: 360,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #2e1a4a 0%, #1a0b2e 100%)',
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)'
}))

const PopoverHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${dclColors.whiteTransparent.subtle}`,
  backgroundColor: dclColors.blackTransparent.blurry,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: dclColors.neutral.softWhite,
  flexShrink: 0
}))

const PopoverList = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  ['&::-webkit-scrollbar']: { width: 6 },
  ['&::-webkit-scrollbar-thumb']: {
    background: dclColors.whiteTransparent.blurry,
    borderRadius: 3
  }
}))

const PopoverRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(0.75, 1),
  borderRadius: 8,
  ['&:hover']: { backgroundColor: dclColors.whiteTransparent.subtle }
}))

const PersonName = styled(Typography)({
  fontSize: 13,
  fontWeight: 600,
  color: dclColors.neutral.softWhite,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
  minWidth: 0
})

const PersonAddress = styled(Typography)({
  fontSize: 11,
  color: dclColors.neutral.gray3,
  fontFamily: 'monospace',
  letterSpacing: '0.04em'
})

const EmptyState = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  color: dclColors.neutral.gray3,
  textAlign: 'center',
  padding: theme.spacing(3, 2)
}))

export {
  AvatarStack,
  EmptyState,
  MINI_AVATAR_SIZE,
  OverflowDisc,
  PersonAddress,
  PersonName,
  PopoverHeader,
  PopoverList,
  PopoverRow,
  PopoverShell,
  StackCount,
  StackSlot,
  StackTrigger
}

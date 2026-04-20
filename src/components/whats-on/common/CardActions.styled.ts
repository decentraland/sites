// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeIcon from '@mui/icons-material/AccessTime'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { CalendarAddIcon as CalendarIcon } from './CalendarAddIcon'

// No dclColors token for this hover shade — between gray5 (#ECEBED) and gray4
const ACTION_BUTTON_HOVER_BG = '#D9D8DB'

// No dclColors token — design-system success green used for avatar fallback
const AVATAR_FALLBACK_GREEN = '#00B453'

const ActionButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: dclColors.neutral.gray5,
  border: 'none',
  borderRadius: 8,
  padding: 6,
  width: 30,
  height: 30,
  flexShrink: 0,
  color: dclColors.neutral.softBlack1,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, color 0.35s ease',
  ['&:hover']: {
    backgroundColor: ACTION_BUTTON_HOVER_BG
  },
  ['&[data-active="true"]']: {
    color: dclColors.base.primary,
    transition: 'color 0.15s ease'
  },
  ['&:disabled']: {
    opacity: 0.5,
    cursor: 'default'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
}))

const ActionTextButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  backgroundColor: dclColors.neutral.gray5,
  border: 'none',
  borderRadius: 8,
  padding: 6,
  minWidth: 30,
  flexShrink: 1,
  color: dclColors.neutral.softBlack1,
  cursor: 'pointer',
  overflow: 'hidden',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  ['&:hover']: {
    backgroundColor: ACTION_BUTTON_HOVER_BG
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
}))

const actionTextLabelBase = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const
}

/* eslint-disable @typescript-eslint/naming-convention */
const ActionTextLabel = styled('span')({
  ...actionTextLabelBase,
  '@container (max-width: 340px)': {
    display: 'none'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const RemindActiveButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  backgroundColor: dclColors.neutral.softWhite,
  border: 'none',
  borderRadius: 8,
  padding: 6,
  minWidth: 30,
  flexShrink: 1,
  color: dclColors.base.primary,
  cursor: 'pointer',
  overflow: 'hidden',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  ['&:hover']: {
    backgroundColor: ACTION_BUTTON_HOVER_BG
  },
  ['&:disabled']: {
    opacity: 0.5,
    cursor: 'default'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
}))

const CopyIcon = styled(ContentCopyIcon)({
  fontSize: 18,
  color: 'inherit'
})

const AvatarImage = styled('img')({
  width: 19,
  height: 19,
  borderRadius: '50%',
  border: `1.4px solid ${dclColors.whiteTransparent.blurry}`,
  flexShrink: 0,
  objectFit: 'cover'
})

const AvatarFallback = styled(Box)({
  width: 19,
  height: 19,
  borderRadius: '50%',
  backgroundColor: AVATAR_FALLBACK_GREEN,
  border: `1.4px solid ${dclColors.whiteTransparent.blurry}`,
  flexShrink: 0
})

const CreatorName = styled(Typography)({
  fontSize: 12,
  lineHeight: 1,
  color: dclColors.neutral.softWhite,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const CreatorNameHighlight = styled('span')({
  color: dclColors.base.primary
})

const CreatorRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8
})

const TimePill = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: dclColors.whiteTransparent.subtle,
  borderRadius: 6,
  padding: '2px 8px 2px 4px',
  height: 24,
  width: 'fit-content',
  maxWidth: '100%',
  transition: 'opacity 0.2s ease'
})

const TimeIcon = styled(AccessTimeIcon)({
  fontSize: 20,
  color: dclColors.neutral.softWhite
})

const TimeLabel = styled(Typography)({
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.5,
  color: dclColors.neutral.softWhite,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
})

const HoverActions = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 4,
  opacity: 0,
  transform: 'translateY(8px)',
  transition: 'opacity 0.2s ease, transform 0.2s ease',
  flexWrap: 'nowrap'
})

const CARD_HOVER_SHADOW = '0px 2px 12px 12px rgba(255, 255, 255, 0.3)'

export {
  ActionButton,
  CARD_HOVER_SHADOW,
  ActionTextButton,
  ActionTextLabel,
  AvatarFallback,
  AvatarImage,
  CalendarIcon,
  CopyIcon,
  CreatorName,
  CreatorNameHighlight,
  CreatorRow,
  HoverActions,
  RemindActiveButton,
  TimeIcon,
  TimeLabel,
  TimePill
}

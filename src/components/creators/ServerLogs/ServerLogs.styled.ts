import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import type { ServerLogLevel } from '../../../features/authServer'
import type { ServerLogsStatus } from '../../../hooks/useServerLogs'

const LogsRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5)
}))

const Hint = styled(Typography)({ fontSize: 13, color: dclColors.neutral.gray3 })

// White-pill connect CTA (matches the design-system primary button on dark).
const ConnectButton = styled('button')(({ theme }) => ({
  height: 40,
  paddingInline: theme.spacing(3),
  backgroundColor: dclColors.neutral.softWhite,
  color: dclColors.neutral.softBlack1,
  border: 'none',
  borderRadius: theme.spacing(1.5),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  ['&:hover']: { backgroundColor: 'rgba(252, 252, 252, 0.85)' },
  ['&:active']: { transform: 'scale(0.98)' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2 }
}))

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  flexWrap: 'wrap'
}))

const ToolbarActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const STATUS_COLOR: Record<ServerLogsStatus, string> = {
  idle: dclColors.neutral.gray3,
  connecting: '#E8A33D',
  streaming: '#4CD964',
  error: '#FF2D55'
}

const StatusChip = styled(Typography, { shouldForwardProp: prop => prop !== '$status' })<{ $status: ServerLogsStatus }>(
  ({ theme, $status }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: dclColors.neutral.softWhite,
    ['&::before']: {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: STATUS_COLOR[$status]
    }
  })
)

// Terminal-style scroll area hosting the streamed log lines.
const LogConsole = styled(Box)(({ theme }) => ({
  fontFamily: 'monospace',
  fontSize: 12.5,
  lineHeight: 1.6,
  color: dclColors.neutral.softWhite,
  backgroundColor: dclColors.neutral.softBlack1,
  border: `1px solid ${dclColors.whiteTransparent.subtle}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(2),
  height: 420,
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
}))

const CenterState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  height: '100%',
  textAlign: 'center',
  color: dclColors.neutral.gray3,
  fontSize: 13
}))

const LogRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'baseline'
}))

const LogTime = styled('span')({
  color: dclColors.neutral.gray3,
  flexShrink: 0
})

const LEVEL_COLOR: Record<ServerLogLevel, string> = {
  error: '#FF2D55',
  warn: '#E8A33D',
  debug: dclColors.neutral.gray3,
  info: '#7AB8FF'
}

const LogLevel = styled('span', { shouldForwardProp: prop => prop !== '$level' })<{ $level: ServerLogLevel }>(({ $level }) => ({
  color: LEVEL_COLOR[$level],
  fontWeight: 700,
  flexShrink: 0,
  textTransform: 'uppercase'
}))

const LogMessage = styled('span')({ color: dclColors.neutral.softWhite, minWidth: 0 })

const LogExtra = styled('span')({ color: dclColors.neutral.gray3, opacity: 0.8 })

export {
  CenterState,
  ConnectButton,
  Hint,
  LogConsole,
  LogExtra,
  LogLevel,
  LogMessage,
  LogRow,
  LogsRoot,
  LogTime,
  StatusChip,
  Toolbar,
  ToolbarActions
}

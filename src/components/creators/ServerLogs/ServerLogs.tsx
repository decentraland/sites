import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button, CircularProgress } from 'decentraland-ui2'
import type { ServerLogLine, ServerLogsScope } from '../../../features/authServer'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useServerLogs } from '../../../hooks/useServerLogs'
import {
  CenterState,
  ConnectButton,
  Hint,
  LogConsole,
  LogExtra,
  LogLevel,
  LogMessage,
  LogRow,
  LogTime,
  LogsRoot,
  StatusChip,
  Toolbar,
  ToolbarActions
} from './ServerLogs.styled'

function formatTime(timestamp: number): string {
  // HH:MM:SS in local time — the date rarely matters for a live tail.
  return new Date(timestamp).toLocaleTimeString([], { hour12: false })
}

interface LogLineRowProps {
  line: ServerLogLine
}

// Memo'd list row (rule 11).
const LogLineRow = memo(function LogLineRow({ line }: LogLineRowProps) {
  return (
    <LogRow>
      <LogTime>{formatTime(line.timestamp)}</LogTime>
      <LogLevel $level={line.level}>{line.level}</LogLevel>
      <LogMessage>
        {line.message}
        {line.extra ? <LogExtra> {line.extra}</LogExtra> : null}
      </LogMessage>
    </LogRow>
  )
})

interface ServerLogsProps {
  // Null when the viewer isn't signed in (no identity to sign the stream).
  scope: ServerLogsScope | null
}

function ServerLogs({ scope }: ServerLogsProps) {
  const t = useFormatMessage()
  // The SSE stream opens only after an explicit connect — never on mount — so we
  // don't hold a server stream open unless the creator is watching it.
  const [started, setStarted] = useState(false)
  const { status, lines, clear, reconnect } = useServerLogs({ scope, enabled: started })

  const consoleRef = useRef<HTMLDivElement | null>(null)
  // Pin to the bottom as new lines arrive (a live tail).
  useEffect(() => {
    const node = consoleRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [lines])

  const statusLabel = useMemo(() => {
    if (status === 'connecting') return t('page.creators.world.auth_server_logs_connecting')
    if (status === 'error') return t('page.creators.world.auth_server_logs_disconnected')
    return t('page.creators.world.auth_server_logs_live')
  }, [status, t])

  if (!scope) {
    return <Hint>{t('page.creators.world.auth_server_logs_sign_in')}</Hint>
  }

  if (!started) {
    return (
      <LogsRoot>
        <Hint>{t('page.creators.world.auth_server_logs_hint')}</Hint>
        <LogConsole>
          <CenterState>
            <span>{t('page.creators.world.auth_server_logs_empty')}</span>
            <ConnectButton type="button" onClick={() => setStarted(true)}>
              {t('page.creators.world.auth_server_logs_connect')}
            </ConnectButton>
          </CenterState>
        </LogConsole>
      </LogsRoot>
    )
  }

  return (
    <LogsRoot>
      <Toolbar>
        <StatusChip $status={status}>{statusLabel}</StatusChip>
        <ToolbarActions>
          {status === 'error' ? (
            <Button variant="outlined" color="secondary" size="small" onClick={reconnect}>
              {t('page.creators.world.auth_server_logs_reconnect')}
            </Button>
          ) : null}
          <Button variant="text" color="secondary" size="small" disabled={lines.length === 0} onClick={clear}>
            {t('page.creators.world.auth_server_logs_clear')}
          </Button>
          <Button variant="outlined" color="error" size="small" onClick={() => setStarted(false)}>
            {t('page.creators.world.auth_server_logs_stop')}
          </Button>
        </ToolbarActions>
      </Toolbar>

      <LogConsole ref={consoleRef}>
        {status === 'connecting' && lines.length === 0 ? (
          <CenterState>
            <CircularProgress size={22} />
            <span>{t('page.creators.world.auth_server_logs_connecting')}</span>
          </CenterState>
        ) : status === 'error' && lines.length === 0 ? (
          <CenterState>
            <span>{t('page.creators.world.auth_server_logs_error')}</span>
          </CenterState>
        ) : lines.length === 0 ? (
          <CenterState>
            <span>{t('page.creators.world.auth_server_logs_empty')}</span>
          </CenterState>
        ) : (
          lines.map(line => <LogLineRow key={line.id} line={line} />)
        )}
      </LogConsole>
    </LogsRoot>
  )
}

export { ServerLogs }

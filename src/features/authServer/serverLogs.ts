import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../../config/env'
import type { ServerLogLevel, ServerLogLine, ServerLogsScope } from './serverLogs.types'

const FALLBACK_MULTIPLAYER_SERVER_URL = 'https://multiplayer-server.decentraland.org'

// Lazy getter with a prod fallback — never throws at import (rule 16).
const getMultiplayerServerUrl = (): string => getEnv('MULTIPLAYER_SERVER_URL') || FALLBACK_MULTIPLAYER_SERVER_URL

const logsSignedFetch = signedFetchFactory()

const LEVELS: ServerLogLevel[] = ['error', 'warn', 'debug', 'info']
const STANDARD_FIELDS = ['timestamp', 'time', 'level', 'severity', 'message', 'msg']

function normalizeLevel(raw: unknown): ServerLogLevel {
  const value = String(raw ?? '').toLowerCase()
  if (value === 'warning') return 'warn'
  if (value === 'trace') return 'info'
  return (LEVELS as string[]).includes(value) ? (value as ServerLogLevel) : 'info'
}

// Parse one raw stream line (mirrors the sdk-commands `formatAndPrintLog`):
// strip an optional SSE `data:` prefix, JSON-parse, and pull timestamp / level
// / message, keeping any extra fields. Non-JSON lines become a plain message.
function parseLogLine(raw: string, id: number, now: number): ServerLogLine | null {
  let line = raw.trim()
  if (!line || line.startsWith(':')) return null
  if (line.startsWith('data:')) line = line.slice(5).trim()
  if (!line) return null

  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(line) as Record<string, unknown>
  } catch {
    return { id, timestamp: now, level: 'info', message: line }
  }

  const rawTs = obj.timestamp ?? obj.time
  const parsedTs = rawTs != null ? new Date(rawTs as string | number).getTime() : NaN
  const timestamp = Number.isNaN(parsedTs) ? now : parsedTs
  const level = normalizeLevel(obj.level ?? obj.severity)
  const message = String(obj.message ?? obj.msg ?? JSON.stringify(obj))

  const extraEntries = Object.keys(obj).filter(key => !STANDARD_FIELDS.includes(key))
  const extra = extraEntries.length > 0 ? JSON.stringify(Object.fromEntries(extraEntries.map(k => [k, obj[k]]))) : undefined

  return { id, timestamp, level, message, extra }
}

interface StreamServerLogsOptions {
  scope: ServerLogsScope
  signal: AbortSignal
  onLine: (line: ServerLogLine) => void
  onOpen: () => void
}

// Open the signed SSE connection and pump parsed lines to `onLine` until the
// stream ends or `signal` aborts. Resolves on natural end; rejects on a
// non-aborted failure so the caller can surface an error state.
async function streamServerLogs(options: StreamServerLogsOptions): Promise<void> {
  const { scope, signal, onLine, onOpen } = options
  const metadata = {
    parcel: scope.parcel,
    realmName: scope.realmName,
    sceneId: scope.sceneId
  }

  const response = await logsSignedFetch(`${getMultiplayerServerUrl()}/logs`, {
    method: 'GET',
    identity: scope.identity,
    metadata,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { Accept: 'text/event-stream' },
    signal
  })

  if (!response.ok || !response.body) {
    throw new Error(`server-logs request failed: ${response.status}`)
  }

  onOpen()

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let counter = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const rawLine of lines) {
      const parsed = parseLogLine(rawLine, counter, Date.now())
      if (parsed) {
        counter += 1
        onLine(parsed)
      }
    }
  }
}

export { getMultiplayerServerUrl, parseLogLine, streamServerLogs }
export type { StreamServerLogsOptions }

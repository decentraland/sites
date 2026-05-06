// Maps RTK Query / fetch errors to a stable cast i18n key. Per CLAUDE.md
// rule 10 we never propagate the raw server error string to the UI; instead
// we log the raw value and surface a translated, user-friendly message.

type CastErrorContext = 'watcher_token' | 'streamer_token' | 'world_scenes' | 'stream_info'

const isFetchError = (err: unknown): err is { status: number | string; data?: unknown } =>
  typeof err === 'object' && err !== null && 'status' in err

const getStatus = (err: unknown): number | string | null => (isFetchError(err) ? err.status : null)

const isNetworkStatus = (status: number | string | null): boolean =>
  status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR' || status === 'PARSING_ERROR'

const getCastErrorKey = (err: unknown, context: CastErrorContext): string => {
  const status = getStatus(err)

  if (isNetworkStatus(status)) {
    return `${context === 'streamer_token' ? 'streamer' : 'watcher'}.error_network`
  }

  switch (context) {
    case 'watcher_token':
      if (status === 404) return 'watcher.error_no_active_stream'
      if (status === 401 || status === 403) return 'watcher.error_unauthorized'
      if (status === 400) return 'watcher.error_invalid_location'
      return 'watcher.error_connection'

    case 'streamer_token':
      if (status === 404 || status === 401 || status === 400) return 'streamer.error_invalid_token'
      if (status === 403) return 'streamer.error_unauthorized'
      return 'streamer.error_initialize_streaming'

    case 'world_scenes':
      if (status === 404) return 'watcher.error_world_not_found'
      return 'watcher.error_connection'

    case 'stream_info':
      if (status === 404) return 'streamer.error_invalid_token'
      return 'streamer.error_connection'
  }
}

export type { CastErrorContext }
export { getCastErrorKey }

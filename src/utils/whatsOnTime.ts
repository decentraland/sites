type TranslateFn = (key: string, values?: Record<string, string | number>) => string

function getRelativeTimeLabel(startTime: string, t: TranslateFn): string {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const diffMs = start - now

  if (diffMs <= 0) {
    return formatTime(startTime)
  }

  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 60) {
    return t('upcoming.starts_in_mins', { count: diffMins })
  }

  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) {
    return t('upcoming.starts_in_hours', { count: diffHours })
  }

  return formatTime(startTime)
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
}

export { getRelativeTimeLabel }
export type { TranslateFn }

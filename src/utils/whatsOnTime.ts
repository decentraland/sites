type TranslateFn = (key: string, values?: Record<string, string | number>) => string

function getRelativeTimeLabel(startTime: string, t: TranslateFn): string {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const diffMs = start - now

  if (diffMs <= 0) {
    return formatLocalTime(startTime)
  }

  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 60) {
    return t('upcoming.starts_in_mins', { count: diffMins })
  }

  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) {
    return t('upcoming.starts_in_hours', { count: diffHours })
  }

  return formatLocalTime(startTime)
}

function formatLocalTime(isoString: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(isoString))
}

function formatLocalDate(isoString: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(isoString))
}

function formatUtcTime(isoString: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(new Date(isoString))
}

function formatUtcDate(isoString: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(isoString))
}

// Whole-day shift between the local calendar date and the UTC calendar date for `isoString`. Values
// are clamped to -1, 0, +1 because timezone offsets max out at ±14h, so UTC and local can never differ
// by more than one calendar day.
function getUtcDayDelta(isoString: string): -1 | 0 | 1 {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return 0
  const localDay = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  const utcDay = date.getUTCFullYear() * 10000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate()
  if (utcDay > localDay) return 1
  if (utcDay < localDay) return -1
  return 0
}

function formatUtcTooltip(isoString: string, locale: string, t: TranslateFn): string {
  const time = formatUtcTime(isoString, locale)
  const delta = getUtcDayDelta(isoString)
  if (delta === 1) return t('event_time.utc_next_day', { time })
  if (delta === -1) return t('event_time.utc_previous_day', { time })
  return t('event_time.utc_same_day', { time })
}

function formatUtcRangeTooltip(startIso: string, finishIso: string | null, locale: string, t: TranslateFn): string {
  if (!finishIso) return formatUtcTooltip(startIso, locale, t)
  const startDelta = getUtcDayDelta(startIso)
  const finishDelta = getUtcDayDelta(finishIso)
  if (startDelta === 0 && finishDelta === 0) {
    return t('event_time.utc_range_same_day', { start: formatUtcTime(startIso, locale), end: formatUtcTime(finishIso, locale) })
  }
  return t('event_time.utc_range_with_dates', {
    startDate: formatUtcDate(startIso, locale),
    start: formatUtcTime(startIso, locale),
    endDate: formatUtcDate(finishIso, locale),
    end: formatUtcTime(finishIso, locale)
  })
}

export {
  formatLocalDate,
  formatLocalTime,
  formatUtcDate,
  formatUtcRangeTooltip,
  formatUtcTime,
  formatUtcTooltip,
  getRelativeTimeLabel,
  getUtcDayDelta
}
export type { TranslateFn }

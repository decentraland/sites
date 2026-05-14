// Recurrence helpers shared by the create-event form, the event detail modal,
// the live-now mapper, and the Google Calendar URL builder. Lives in `utils/`
// (not `hooks/useCreateEventForm.helpers.ts`) because consumers outside the form
// rely on these too — the previous location implied form-only ownership.

const WEEKDAY_INDICES: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6]
const ALL_WEEKDAYS: ReadonlyArray<number> = WEEKDAY_INDICES

function normalizeDayIndices(days: number[]): number[] {
  return [...new Set(days)].filter(d => d >= 0 && d <= 6).sort((a, b) => a - b)
}

// Mirrors `WeekdayMask` in events/src/entities/Event/types.ts:
// SUNDAY=1, MONDAY=2, TUESDAY=4, WEDNESDAY=8, THURSDAY=16, FRIDAY=32, SATURDAY=64.
function dayIndicesToWeekdayMask(days: number[]): number {
  return days.reduce((mask, day) => (day >= 0 && day <= 6 ? mask | (1 << day) : mask), 0)
}

function weekdayMaskToDayIndices(mask: number | null | undefined): number[] {
  if (mask === null || mask === undefined || mask === 0) return [...ALL_WEEKDAYS]
  return ALL_WEEKDAYS.filter(day => (mask & (1 << day)) !== 0)
}

function parseStartWeekday(startDate: string): number | null {
  if (!startDate) return null
  const date = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.getDay()
}

// Reference Sunday (UTC) — `1970-01-04` was a Sunday. Adding `dayIndex * 86_400_000` ms yields a
// UTC date that falls on the requested weekday. `timeZone: 'UTC'` on the formatter is critical —
// without it the local TZ offset can shift the formatter onto the previous/next day.
const SUNDAY_EPOCH_MS = Date.UTC(1970, 0, 4)
const ONE_DAY_MS = 24 * 60 * 60 * 1000

// Memoize Intl.DateTimeFormat by (locale, style) — `formatRecurrentDays` can call up to 7 times
// per render, and the formatter is non-trivial to construct.
const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>()

function getWeekdayFormatter(locale: string | undefined, style: 'short' | 'long'): Intl.DateTimeFormat {
  const key = `${locale ?? ''}:${style}`
  let formatter = FORMATTER_CACHE.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' })
    FORMATTER_CACHE.set(key, formatter)
  }
  return formatter
}

function localizedWeekdayShort(dayIndex: number, locale?: string): string {
  return getWeekdayFormatter(locale, 'short').format(new Date(SUNDAY_EPOCH_MS + dayIndex * ONE_DAY_MS))
}

function localizedWeekdayLong(dayIndex: number, locale?: string): string {
  return getWeekdayFormatter(locale, 'long').format(new Date(SUNDAY_EPOCH_MS + dayIndex * ONE_DAY_MS))
}

export {
  ALL_WEEKDAYS,
  WEEKDAY_INDICES,
  dayIndicesToWeekdayMask,
  localizedWeekdayLong,
  localizedWeekdayShort,
  normalizeDayIndices,
  parseStartWeekday,
  weekdayMaskToDayIndices
}

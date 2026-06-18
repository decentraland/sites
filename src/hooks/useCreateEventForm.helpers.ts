import type { EventEntry, RecurrentFrequency } from '../features/events'
import type { CreateEventFormState } from './useCreateEventForm.types'

const DURATION_PATTERN = /^([0-9]{1,2}):([0-5][0-9])$/

function parseDurationMs(value: string): number | null {
  const match = value.match(DURATION_PATTERN)
  if (!match) return null
  const totalMinutes = Number(match[1]) * 60 + Number(match[2])
  return totalMinutes > 0 ? totalMinutes * 60 * 1000 : null
}

// The combined recurrence selector folds the old "frequency" dropdown + "repeat every N weeks"
// chips into a single ordered list. Each option maps to the API's (frequency, interval) pair.
// Biweekly is now a first-class choice instead of "Weekly" + "2 weeks", and the weekly weekday is
// always start_at's own weekday (no per-weekday mask), so a one-day event never spreads across days.
const RECURRENCE_OPTIONS = ['every_day', 'every_week', 'every_2_weeks', 'every_3_weeks', 'every_4_weeks', 'every_month'] as const

type RecurrenceOption = (typeof RECURRENCE_OPTIONS)[number]

/* eslint-disable @typescript-eslint/naming-convention -- keys are recurrence option ids */
const RECURRENCE_TO_API: Record<RecurrenceOption, { frequency: RecurrentFrequency; interval: number }> = {
  every_day: { frequency: 'DAILY', interval: 1 },
  every_week: { frequency: 'WEEKLY', interval: 1 },
  every_2_weeks: { frequency: 'WEEKLY', interval: 2 },
  every_3_weeks: { frequency: 'WEEKLY', interval: 3 },
  every_4_weeks: { frequency: 'WEEKLY', interval: 4 },
  every_month: { frequency: 'MONTHLY', interval: 1 }
}
/* eslint-enable @typescript-eslint/naming-convention */

// NOTE: the new-event default recurrence is now 'every_week' (was 'every_day' before #560).
// `repeatEnabled` still starts false, so this only surfaces once a user turns on Repeat, and weekly
// is the most common cadence creators reach for.
const DEFAULT_RECURRENCE: RecurrenceOption = 'every_week'

function recurrenceToApi(recurrence: string): { frequency: RecurrentFrequency; interval: number } {
  return RECURRENCE_TO_API[recurrence as RecurrenceOption] ?? RECURRENCE_TO_API[DEFAULT_RECURRENCE]
}

// Map a saved event's (frequency, interval) back onto a single combined option for the edit form.
// WEEKLY intervals are clamped into the 1-4 range the selector offers; HOURLY/YEARLY (which this
// form can't author) and any unknown frequency fall back to the default weekly option.
function apiToRecurrence(frequency: RecurrentFrequency | null | undefined, interval: number | null | undefined): RecurrenceOption {
  switch (frequency) {
    case 'DAILY':
      return 'every_day'
    case 'MONTHLY':
      return 'every_month'
    case 'WEEKLY': {
      const clamped = Math.min(Math.max(Math.round(interval ?? 1) || 1, 1), 4)
      return clamped === 1 ? 'every_week' : (`every_${clamped}_weeks` as RecurrenceOption)
    }
    default:
      return DEFAULT_RECURRENCE
  }
}

const DAY_MS = 24 * 60 * 60 * 1000
const RECURRENCE_PREVIEW_COUNT = 5
const MAX_PREVIEW_ITERATIONS = 1000

// Advance a date by whole months, anchored on the start day-of-month and clamped to the target
// month's last day (Jan 31 + 1mo -> Feb 28/29) so the preview mirrors the server's RRule rather
// than JS's silent day overflow.
function addMonthsClamped(date: Date, months: number): Date {
  const anchorDay = date.getDate()
  const shifted = new Date(date.getTime())
  shifted.setDate(1)
  shifted.setMonth(shifted.getMonth() + months)
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate()
  shifted.setDate(Math.min(anchorDay, lastDay))
  return shifted
}

// Best-effort client-side projection of the next occurrences for the recurrence preview. Mirrors the
// single-weekday model the form submits (weekly cadences step by whole weeks from start_at, so every
// occurrence keeps start_at's weekday). Only occurrences at/after `now` are returned, capped at
// `count`; an empty array means "nothing upcoming" (e.g. the end date already passed).
function computeUpcomingOccurrences(
  startDate: string,
  startTime: string,
  recurrence: string,
  repeatEndDate: string,
  now: number = Date.now(),
  count: number = RECURRENCE_PREVIEW_COUNT
): Date[] {
  if (!startDate || !startTime) return []
  const start = new Date(`${startDate}T${startTime}`)
  if (Number.isNaN(start.getTime())) return []
  if (!Object.prototype.hasOwnProperty.call(RECURRENCE_TO_API, recurrence)) return []
  const { frequency, interval } = recurrenceToApi(recurrence)

  const end = repeatEndDate ? new Date(`${repeatEndDate}T23:59:59`) : null
  const endTs = end && !Number.isNaN(end.getTime()) ? end.getTime() : null

  const next = (date: Date): Date => {
    if (frequency === 'MONTHLY') return addMonthsClamped(date, interval)
    const stepDays = frequency === 'DAILY' ? interval : interval * 7
    return new Date(date.getTime() + stepDays * DAY_MS)
  }

  const occurrences: Date[] = []
  let current = start
  for (let i = 0; i < MAX_PREVIEW_ITERATIONS && occurrences.length < count; i++) {
    if (endTs !== null && current.getTime() > endTs) break
    if (current.getTime() >= now) occurrences.push(current)
    current = next(current)
  }
  return occurrences
}

const INITIAL_STATE: CreateEventFormState = {
  image: null,
  imagePreviewUrl: null,
  imageUrl: null,
  imageError: null,
  isUploadingImage: false,
  verticalImage: null,
  verticalImagePreviewUrl: null,
  verticalImageUrl: null,
  verticalImageError: null,
  isUploadingVerticalImage: false,
  name: '',
  description: '',
  startDate: '',
  startTime: '',
  duration: '',
  repeatEnabled: false,
  recurrence: DEFAULT_RECURRENCE,
  repeatEndDate: '',
  location: 'land',
  coordX: '0',
  coordY: '0',
  world: '',
  communityId: '',
  email: ''
}

function splitIsoDateTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' }
  const pad = (value: number): string => String(value).padStart(2, '0')
  // The form collects local date/time and submits it with Date#toISOString; edit hydration mirrors that to preserve the same instant.
  const date = `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
  const time = `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  return { date, time }
}

function durationMsToHhMm(durationMs: number | null | undefined): string {
  if (!durationMs || durationMs <= 0) return ''
  const totalMinutes = Math.round(durationMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}`
}

function resolveDurationMs(event: EventEntry, referenceStartAt: string): number {
  if (typeof event.duration === 'number' && event.duration > 0) return event.duration
  if (referenceStartAt && event.finish_at) {
    const diff = new Date(event.finish_at).getTime() - new Date(referenceStartAt).getTime()
    return diff > 0 ? diff : 0
  }
  return 0
}

// For recurrent events the API keeps `start_at` pointing at the first occurrence ever — which can
// sit months in the past — while `next_start_at` tracks the upcoming one. Hydrating the edit form
// from `start_at` (the default) leaves owners staring at a stale anchor date and asking "where did
// my saved time go?" — issue #474. When `start_at` is clearly historical, prefer `next_start_at`
// so the form shows the date the user is about to re-schedule.
function resolveFormReferenceStartAt(event: EventEntry, now: number): string {
  // `next_start_at` is typed as `string`, but every consumer that pivots on it guards defensively
  // (see `PendingEventCard.tsx`), so mirror that pattern rather than trusting the declaration alone.
  if (!event.recurrent || !event.next_start_at) return event.start_at
  const startMs = new Date(event.start_at).getTime()
  if (!Number.isFinite(startMs) || startMs >= now) return event.start_at
  return event.next_start_at
}

function eventEntryToFormState(event: EventEntry, now: number = Date.now()): CreateEventFormState {
  const referenceStartAt = resolveFormReferenceStartAt(event, now)
  const start = splitIsoDateTime(referenceStartAt)
  const durationMs = resolveDurationMs(event, referenceStartAt)
  const lastRecurrentDate = event.recurrent_dates?.[event.recurrent_dates.length - 1] ?? null
  const repeatEnd = splitIsoDateTime(lastRecurrentDate)
  // Treat events whose `world: true` flag isn't backed by a non-empty `server`
  // name as Land. The combination is an upstream-data symptom: the events API
  // has been observed returning `world: true` for events created with valid
  // Genesis City coords (server stays null). Loading them as 'world' here
  // trapped owners in an empty world-selector with their original x/y silently
  // zeroed out. The string-length guard handles both `null` and `''` so a
  // backend returning an empty server string can't sneak past the check.
  const hasWorldName = typeof event.server === 'string' && event.server.length > 0
  const isWorld = Boolean(event.world) && hasWorldName

  return {
    ...INITIAL_STATE,
    imageUrl: event.image ?? null,
    imagePreviewUrl: event.image ?? null,
    verticalImageUrl: event.image_vertical ?? null,
    verticalImagePreviewUrl: event.image_vertical ?? null,
    name: event.name ?? '',
    description: event.description ?? '',
    startDate: start.date,
    startTime: start.time,
    duration: durationMsToHhMm(durationMs),
    repeatEnabled: Boolean(event.recurrent),
    recurrence: apiToRecurrence(event.recurrent_frequency, event.recurrent_interval),
    repeatEndDate: repeatEnd.date,
    location: isWorld ? 'world' : 'land',
    coordX: isWorld ? '0' : String(event.x ?? 0),
    coordY: isWorld ? '0' : String(event.y ?? 0),
    world: isWorld ? event.server ?? '' : '',
    communityId: event.community_id ?? '',
    email: event.contact ?? ''
  }
}

export {
  DURATION_PATTERN,
  INITIAL_STATE,
  RECURRENCE_OPTIONS,
  computeUpcomingOccurrences,
  durationMsToHhMm,
  eventEntryToFormState,
  parseDurationMs,
  recurrenceToApi
}

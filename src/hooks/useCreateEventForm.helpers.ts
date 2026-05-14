import type { EventEntry, RecurrentFrequency } from '../features/events'
import type { CreateEventFormState } from './useCreateEventForm.types'

/* eslint-disable @typescript-eslint/naming-convention -- keys are API enum values */
const REVERSE_FREQUENCY_MAP: Partial<Record<RecurrentFrequency, string>> = {
  DAILY: 'every_day',
  WEEKLY: 'every_week',
  MONTHLY: 'every_month'
}

const FREQUENCY_MAP: Record<string, RecurrentFrequency> = {
  every_day: 'DAILY',
  every_week: 'WEEKLY',
  every_month: 'MONTHLY'
}
/* eslint-enable @typescript-eslint/naming-convention */

const DURATION_PATTERN = /^([0-9]{1,2}):([0-5][0-9])$/

function parseDurationMs(value: string): number | null {
  const match = value.match(DURATION_PATTERN)
  if (!match) return null
  const totalMinutes = Number(match[1]) * 60 + Number(match[2])
  return totalMinutes > 0 ? totalMinutes * 60 * 1000 : null
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
  frequency: 'every_week',
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
    frequency: (event.recurrent_frequency && REVERSE_FREQUENCY_MAP[event.recurrent_frequency]) ?? 'every_week',
    repeatEndDate: repeatEnd.date,
    location: isWorld ? 'world' : 'land',
    coordX: isWorld ? '0' : String(event.x ?? 0),
    coordY: isWorld ? '0' : String(event.y ?? 0),
    world: isWorld ? event.server ?? '' : '',
    communityId: event.community_id ?? '',
    email: event.contact ?? ''
  }
}

export { DURATION_PATTERN, FREQUENCY_MAP, INITIAL_STATE, durationMsToHhMm, eventEntryToFormState, parseDurationMs }

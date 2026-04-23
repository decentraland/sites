import type { EventEntry, RecurrentFrequency } from '../features/whats-on-events'
import type { CreateEventFormState } from './useCreateEventForm.types'

/* eslint-disable @typescript-eslint/naming-convention -- keys are API enum values */
const REVERSE_FREQUENCY_MAP: Partial<Record<RecurrentFrequency, string>> = {
  DAILY: 'every_day',
  WEEKLY: 'every_week',
  MONTHLY: 'every_month'
}
/* eslint-enable @typescript-eslint/naming-convention */

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

function resolveDurationMs(event: EventEntry): number {
  if (typeof event.duration === 'number' && event.duration > 0) return event.duration
  if (event.start_at && event.finish_at) {
    const diff = new Date(event.finish_at).getTime() - new Date(event.start_at).getTime()
    return diff > 0 ? diff : 0
  }
  return 0
}

function eventEntryToFormState(event: EventEntry): CreateEventFormState {
  const start = splitIsoDateTime(event.start_at)
  const durationMs = resolveDurationMs(event)
  const lastRecurrentDate = event.recurrent_dates?.[event.recurrent_dates.length - 1] ?? null
  const repeatEnd = splitIsoDateTime(lastRecurrentDate)
  const isWorld = Boolean(event.world)

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

export { INITIAL_STATE, durationMsToHhMm, eventEntryToFormState }

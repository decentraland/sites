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
  endDate: '',
  endTime: '',
  repeatEnabled: false,
  frequency: 'every_week',
  repeatEndDate: '',
  location: 'land',
  coordX: '0',
  coordY: '0',
  world: '',
  communityId: '',
  email: '',
  notes: ''
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

function eventEntryToFormState(event: EventEntry): CreateEventFormState {
  const start = splitIsoDateTime(event.start_at)
  const finishIso =
    event.finish_at ?? (event.start_at ? new Date(new Date(event.start_at).getTime() + (event.duration ?? 0)).toISOString() : null)
  const end = splitIsoDateTime(finishIso)
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
    endDate: end.date,
    endTime: end.time,
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

export { INITIAL_STATE, eventEntryToFormState }

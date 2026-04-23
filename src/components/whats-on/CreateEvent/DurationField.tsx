import {
  DurationFieldBox,
  DurationRow,
  ErrorMessage,
  EventFormControl,
  EventInputLabel,
  EventMenuItem,
  EventSelect
} from './EventForm.styled'

const MINUTE_STEP = 15
const MAX_HOURS = 24

const HOUR_OPTIONS = Array.from({ length: MAX_HOURS + 1 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => String(i * MINUTE_STEP).padStart(2, '0'))

function splitDuration(value: string): { hours: string; minutes: string } {
  const [rawHours = '', rawMinutes = ''] = value.split(':')
  const hours = HOUR_OPTIONS.includes(rawHours) ? rawHours : ''
  const minutes = MINUTE_OPTIONS.includes(rawMinutes) ? rawMinutes : ''
  return { hours, minutes }
}

function joinDuration(hours: string, minutes: string): string {
  if (!hours && !minutes) return ''
  return `${hours || '00'}:${minutes || '00'}`
}

type DurationFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
  hoursLabel: string
  minutesLabel: string
}

function DurationField({ value, onChange, error, hoursLabel, minutesLabel }: DurationFieldProps) {
  const { hours, minutes } = splitDuration(value)
  const hasError = Boolean(error)

  return (
    <DurationFieldBox>
      <DurationRow>
        <EventFormControl variant="outlined" fullWidth error={hasError}>
          <EventInputLabel shrink>{hoursLabel}</EventInputLabel>
          <EventSelect
            value={hours}
            onChange={e => onChange(joinDuration(e.target.value as string, minutes))}
            label={hoursLabel}
            notched
            displayEmpty
          >
            <EventMenuItem value="">--</EventMenuItem>
            {HOUR_OPTIONS.map(option => (
              <EventMenuItem key={option} value={option}>
                {option}
              </EventMenuItem>
            ))}
          </EventSelect>
        </EventFormControl>
        <EventFormControl variant="outlined" fullWidth error={hasError}>
          <EventInputLabel shrink>{minutesLabel}</EventInputLabel>
          <EventSelect
            value={minutes}
            onChange={e => onChange(joinDuration(hours, e.target.value as string))}
            label={minutesLabel}
            notched
            displayEmpty
          >
            <EventMenuItem value="">--</EventMenuItem>
            {MINUTE_OPTIONS.map(option => (
              <EventMenuItem key={option} value={option}>
                {option}
              </EventMenuItem>
            ))}
          </EventSelect>
        </EventFormControl>
      </DurationRow>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </DurationFieldBox>
  )
}

export { DurationField }

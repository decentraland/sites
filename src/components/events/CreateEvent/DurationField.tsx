import { useMemo } from 'react'
import { DURATION_MENU_MAX_HEIGHT, DurationClockIcon, DurationIconBox, DurationPlaceholder } from './DurationField.styled'
import { EventFormControl, EventInputLabel, EventMenuItem, EventSelect } from './EventForm.styled'

const STEP_MINUTES = 15
const MAX_MINUTES = 24 * 60

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function minutesToDurationValue(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

function durationValueToMinutes(value: string): number | null {
  const match = value.match(/^([0-9]{1,2}):([0-5][0-9])$/)
  if (!match) return null
  const hours = Number(match[1])
  const mins = Number(match[2])
  const total = hours * 60 + mins
  return total > 0 ? total : null
}

function parseStartMinutes(startTime: string): number | null {
  const match = startTime.match(/^([0-9]{2}):([0-9]{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const mins = Number(match[2])
  if (hours > 23 || mins > 59) return null
  return hours * 60 + mins
}

function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} mins`
  if (mins === 0) return hours === 1 ? '1 hr' : `${hours} hrs`
  return `${hours} hr ${mins} mins`
}

function formatEndTime(startMinutes: number | null, durationMinutes: number): string | null {
  if (startMinutes === null) return null
  const end = (startMinutes + durationMinutes) % (24 * 60)
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`
}

type DurationFieldProps = {
  value: string
  startTime: string
  onChange: (value: string) => void
  error?: string
  label: string
}

function DurationField({ value, startTime, onChange, error, label }: DurationFieldProps) {
  const startMinutes = parseStartMinutes(startTime)

  const options = useMemo(() => {
    const result: { value: string; label: string }[] = []
    for (let m = STEP_MINUTES; m <= MAX_MINUTES; m += STEP_MINUTES) {
      const end = formatEndTime(startMinutes, m)
      const durationLabel = formatDurationLabel(m)
      result.push({
        value: minutesToDurationValue(m),
        label: end ? `${end} (${durationLabel})` : durationLabel
      })
    }
    return result
  }, [startMinutes])

  const currentMinutes = durationValueToMinutes(value)
  const selectValue =
    currentMinutes !== null && options.some(opt => opt.value === value)
      ? value
      : currentMinutes !== null
        ? minutesToDurationValue(currentMinutes)
        : ''

  const hasUnlistedValue = currentMinutes !== null && !options.some(opt => opt.value === selectValue)

  return (
    <EventFormControl variant="outlined" fullWidth error={Boolean(error)}>
      <EventInputLabel shrink>{label}</EventInputLabel>
      <EventSelect
        value={selectValue}
        onChange={e => onChange(e.target.value as string)}
        label={label}
        notched
        displayEmpty
        // eslint-disable-next-line @typescript-eslint/naming-convention
        MenuProps={{ PaperProps: { sx: { maxHeight: DURATION_MENU_MAX_HEIGHT } } }}
        renderValue={selected => {
          const match = options.find(opt => opt.value === selected)
          if (match) return match.label
          if (hasUnlistedValue) return selected as string
          return <DurationPlaceholder>hh:mm</DurationPlaceholder>
        }}
        IconComponent={() => (
          <DurationIconBox>
            <DurationClockIcon />
          </DurationIconBox>
        )}
      >
        {options.map(option => (
          <EventMenuItem key={option.value} value={option.value}>
            {option.label}
          </EventMenuItem>
        ))}
      </EventSelect>
    </EventFormControl>
  )
}

export { DurationField }

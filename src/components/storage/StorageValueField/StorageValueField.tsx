import { forwardRef, useCallback, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Alert, TextField } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

const looksLikeStructuredJson = (value: string): boolean => {
  const trimmed = value.trimStart()
  return trimmed.startsWith('{') || trimmed.startsWith('[')
}

const formatValueForDisplay = (value: unknown): string => {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

interface ParseResult {
  parsedValue: unknown | null
  isValid: boolean
  isJsonError: boolean
}

const parseRawValue = (raw: string): ParseResult => {
  const trimmed = raw.trim()
  if (!trimmed) return { parsedValue: null, isValid: false, isJsonError: false }
  if (looksLikeStructuredJson(trimmed)) {
    try {
      return { parsedValue: JSON.parse(trimmed), isValid: true, isJsonError: false }
    } catch {
      return { parsedValue: null, isValid: false, isJsonError: true }
    }
  }
  return { parsedValue: trimmed, isValid: true, isJsonError: false }
}

const parseValue = (raw: string): unknown | null => parseRawValue(raw).parsedValue

interface StorageValueFieldRef {
  reset: () => void
  getParsedValue: () => unknown | null
}

interface StorageValueFieldChangeEvent {
  parsedValue: unknown | null
  isValid: boolean
}

interface StorageValueFieldProps {
  defaultValue?: unknown
  onChange?: (event: StorageValueFieldChangeEvent) => void
  label?: string
  placeholder?: string
  fullWidth?: boolean
  multiline?: boolean
  rows?: number
  autoFocus?: boolean
  margin?: 'dense' | 'none' | 'normal'
  variant?: 'outlined' | 'filled' | 'standard'
}

const StorageValueField = forwardRef<StorageValueFieldRef, StorageValueFieldProps>(({ defaultValue, onChange, ...textFieldProps }, ref) => {
  const t = useFormatMessage()
  const errorId = useId()
  const [value, setValue] = useState(() => (defaultValue !== undefined ? formatValueForDisplay(defaultValue) : ''))

  const valueRef = useRef(value)
  valueRef.current = value

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const jsonError = useMemo(() => {
    const { isJsonError } = parseRawValue(value)
    return isJsonError ? t('component.storage.value_field.json_error') : null
  }, [value, t])

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue)
    const result = parseRawValue(newValue)
    onChangeRef.current?.({ parsedValue: result.parsedValue, isValid: result.isValid })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        setValue('')
        onChangeRef.current?.({ parsedValue: null, isValid: false })
      },
      getParsedValue: () => parseRawValue(valueRef.current).parsedValue
    }),
    []
  )

  return (
    <>
      <TextField
        {...textFieldProps}
        value={value}
        onChange={e => handleChange(e.target.value)}
        error={Boolean(jsonError)}
        aria-describedby={jsonError ? errorId : undefined}
      />
      {jsonError ? (
        <Alert id={errorId} severity="error" sx={{ mt: 1 }}>
          {jsonError}
        </Alert>
      ) : null}
    </>
  )
})

StorageValueField.displayName = 'StorageValueField'

export { StorageValueField, formatValueForDisplay, looksLikeStructuredJson, parseValue }
export type { StorageValueFieldChangeEvent, StorageValueFieldProps, StorageValueFieldRef }

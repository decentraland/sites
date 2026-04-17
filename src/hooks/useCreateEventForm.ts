import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { useCreateEventMutation } from '../features/explore-events'
import type { RecurrentFrequency } from '../features/explore-events'
import { useAuthIdentity } from './useAuthIdentity'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif']
const ACCEPTED_VERTICAL_IMAGE_TYPES = ['image/png', 'image/jpeg']
const MAX_IMAGE_SIZE_BYTES = 500 * 1024

const COORD_X_MIN = -150
const COORD_X_MAX = 163
const COORD_Y_MIN = -150
const COORD_Y_MAX = 158

type CreateEventFormState = {
  image: File | null
  imagePreviewUrl: string | null
  imageError: string | null
  verticalImage: File | null
  verticalImagePreviewUrl: string | null
  verticalImageError: string | null
  name: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  repeatEnabled: boolean
  frequency: string
  repeatInterval: number
  repeatEndType: 'count' | 'until'
  repeatCount: number
  repeatEndDate: string
  location: string
  coordX: string
  coordY: string
  community: string
  email: string
  notes: string
}

const initialState: CreateEventFormState = {
  image: null,
  imagePreviewUrl: null,
  imageError: null,
  verticalImage: null,
  verticalImagePreviewUrl: null,
  verticalImageError: null,
  name: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  repeatEnabled: false,
  frequency: 'every_week',
  repeatInterval: 1,
  repeatEndType: 'count',
  repeatCount: 3,
  repeatEndDate: '',
  location: 'land',
  coordX: '0',
  coordY: '0',
  community: '',
  email: '',
  notes: ''
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'create_event.error_invalid_image_type'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'create_event.error_image_too_large'
  }
  return null
}

function validateVerticalImage(file: File): string | null {
  if (!ACCEPTED_VERTICAL_IMAGE_TYPES.includes(file.type)) {
    return 'create_event.error_invalid_vertical_image_type'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'create_event.error_image_too_large'
  }
  return null
}

function isValidEmail(email: string): boolean {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidCoordinate(value: string, min: number, max: number): boolean {
  if (value === '') return false
  const num = Number(value)
  return !isNaN(num) && num >= min && num <= max
}

type FormErrors = Partial<Record<string, string>>

/* eslint-disable @typescript-eslint/naming-convention -- keys match form select values */
const FREQUENCY_MAP: Record<string, RecurrentFrequency> = {
  every_day: 'DAILY',
  every_week: 'WEEKLY',
  every_month: 'MONTHLY'
}
/* eslint-enable @typescript-eslint/naming-convention */

function useCreateEventForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { identity } = useAuthIdentity()
  const [createEvent] = useCreateEventMutation()
  const [form, setForm] = useState<CreateEventFormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const setField = useCallback(<TKey extends keyof CreateEventFormState>(key: TKey, value: CreateEventFormState[TKey]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      if (prev[key]) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return prev
    })
  }, [])

  const handleImageSelect = useCallback(
    (file: File) => {
      const errorKey = validateImage(file)
      if (errorKey) {
        setForm(prev => {
          if (prev.imagePreviewUrl) {
            URL.revokeObjectURL(prev.imagePreviewUrl)
          }
          return { ...prev, imageError: t(errorKey), image: null, imagePreviewUrl: null }
        })
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setForm(prev => {
        if (prev.imagePreviewUrl) {
          URL.revokeObjectURL(prev.imagePreviewUrl)
        }
        return { ...prev, image: file, imagePreviewUrl: previewUrl, imageError: null }
      })
    },
    [t]
  )

  const handleImageRemove = useCallback(() => {
    setForm(prev => {
      if (prev.imagePreviewUrl) {
        URL.revokeObjectURL(prev.imagePreviewUrl)
      }
      return { ...prev, image: null, imagePreviewUrl: null, imageError: null }
    })
  }, [])

  const handleVerticalImageSelect = useCallback(
    (file: File) => {
      const errorKey = validateVerticalImage(file)
      if (errorKey) {
        setForm(prev => {
          if (prev.verticalImagePreviewUrl) {
            URL.revokeObjectURL(prev.verticalImagePreviewUrl)
          }
          return { ...prev, verticalImageError: t(errorKey), verticalImage: null, verticalImagePreviewUrl: null }
        })
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setForm(prev => {
        if (prev.verticalImagePreviewUrl) {
          URL.revokeObjectURL(prev.verticalImagePreviewUrl)
        }
        return { ...prev, verticalImage: file, verticalImagePreviewUrl: previewUrl, verticalImageError: null }
      })
    },
    [t]
  )

  const handleVerticalImageRemove = useCallback(() => {
    setForm(prev => {
      if (prev.verticalImagePreviewUrl) {
        URL.revokeObjectURL(prev.verticalImagePreviewUrl)
      }
      return { ...prev, verticalImage: null, verticalImagePreviewUrl: null, verticalImageError: null }
    })
  }, [])

  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}

    if (!form.name.trim()) newErrors.name = t('create_event.error_required')
    if (!form.description.trim()) newErrors.description = t('create_event.error_required')
    if (!form.startDate) newErrors.startDate = t('create_event.error_required')
    if (!form.startTime) newErrors.startTime = t('create_event.error_required')
    if (!form.endDate) newErrors.endDate = t('create_event.error_required')
    if (!form.endTime) newErrors.endTime = t('create_event.error_required')

    if (!isValidCoordinate(form.coordX, COORD_X_MIN, COORD_X_MAX)) {
      newErrors.coordX = t('create_event.error_coord_x_range')
    }
    if (!isValidCoordinate(form.coordY, COORD_Y_MIN, COORD_Y_MAX)) {
      newErrors.coordY = t('create_event.error_coord_y_range')
    }

    if (!isValidEmail(form.email)) {
      newErrors.email = t('create_event.error_invalid_email')
    }

    if (form.repeatEnabled) {
      if (form.repeatInterval < 1) newErrors.repeatInterval = t('create_event.error_invalid_interval')
      if (form.repeatEndType === 'count' && form.repeatCount < 1) newErrors.repeatCount = t('create_event.error_invalid_count')
      if (form.repeatEndType === 'until' && !form.repeatEndDate) newErrors.repeatEndDate = t('create_event.error_required')
    }

    return newErrors
  }, [form, t])

  const isFormValid = useMemo(() => {
    const hasRequiredFields =
      form.name.trim() !== '' &&
      form.description.trim() !== '' &&
      form.startDate !== '' &&
      form.startTime !== '' &&
      form.endDate !== '' &&
      form.endTime !== '' &&
      form.location !== '' &&
      form.coordX !== '' &&
      form.coordY !== ''

    const hasValidCoords =
      isValidCoordinate(form.coordX, COORD_X_MIN, COORD_X_MAX) && isValidCoordinate(form.coordY, COORD_Y_MIN, COORD_Y_MAX)

    const hasValidEmail = isValidEmail(form.email)
    const hasNoImageError = form.imageError === null && form.verticalImageError === null

    return hasRequiredFields && hasValidCoords && hasValidEmail && hasNoImageError
  }, [form])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !identity) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const startAt = new Date(`${form.startDate}T${form.startTime}`).toISOString()
      const finishAt = new Date(`${form.endDate}T${form.endTime}`).toISOString()

      const startMs = new Date(startAt).getTime()
      const finishMs = new Date(finishAt).getTime()
      const duration = finishMs - startMs

      /* eslint-disable @typescript-eslint/naming-convention */
      await createEvent({
        payload: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          start_at: startAt,
          duration,
          x: Number(form.coordX),
          y: Number(form.coordY),
          contact: form.email || null,
          categories: [],
          recurrent: form.repeatEnabled || undefined,
          recurrent_frequency: form.repeatEnabled ? FREQUENCY_MAP[form.frequency] : undefined,
          recurrent_interval: form.repeatEnabled ? form.repeatInterval : undefined,
          recurrent_count: form.repeatEnabled && form.repeatEndType === 'count' ? form.repeatCount : undefined,
          recurrent_until:
            form.repeatEnabled && form.repeatEndType === 'until' ? new Date(`${form.repeatEndDate}T00:00:00`).toISOString() : undefined
        },
        identity
      }).unwrap()
      /* eslint-enable @typescript-eslint/naming-convention */

      navigate('/')
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : t('create_event.error_submit') })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, identity, isSubmitting, validate, createEvent, navigate, t])

  return {
    form,
    errors,
    setField,
    handleImageSelect,
    handleImageRemove,
    handleVerticalImageSelect,
    handleVerticalImageRemove,
    isFormValid,
    isSubmitting,
    handleSubmit
  }
}

export { useCreateEventForm }
export type { CreateEventFormState, FormErrors }

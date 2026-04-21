import { useCallback, useState } from 'react'
import { captureException } from '@sentry/browser'
import { useTranslation } from '@dcl/hooks'
import { useCreateEventMutation, useUploadPosterMutation, useUploadPosterVerticalMutation } from '../features/whats-on-events'
import type { RecurrentFrequency } from '../features/whats-on-events'
import { useAuthIdentity } from './useAuthIdentity'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif']
const ACCEPTED_VERTICAL_IMAGE_TYPES = ['image/png', 'image/jpeg']
const MAX_IMAGE_SIZE_BYTES = 500 * 1024
const VERTICAL_IMAGE_EXPECTED_WIDTH = 716
const VERTICAL_IMAGE_EXPECTED_HEIGHT = 1814

const COORD_X_MIN = -150
const COORD_X_MAX = 163
const COORD_Y_MIN = -150
const COORD_Y_MAX = 158

const MAX_EVENT_DURATION_MS = 24 * 60 * 60 * 1000
const MAX_NAME_LENGTH = 150
const MAX_DESCRIPTION_LENGTH = 5000

type CreateEventFormState = {
  image: File | null
  imagePreviewUrl: string | null
  imageUrl: string | null
  imageError: string | null
  isUploadingImage: boolean
  verticalImage: File | null
  verticalImagePreviewUrl: string | null
  verticalImageUrl: string | null
  verticalImageError: string | null
  isUploadingVerticalImage: boolean
  name: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  repeatEnabled: boolean
  frequency: string
  repeatEndDate: string
  location: string
  coordX: string
  coordY: string
  world: string
  communityId: string
  email: string
  notes: string
}

const initialState: CreateEventFormState = {
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

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode_failed'))
    }
    img.src = url
  })
}

async function validateVerticalImageDimensions(file: File): Promise<string | null> {
  try {
    const { width, height } = await readImageDimensions(file)
    if (width !== VERTICAL_IMAGE_EXPECTED_WIDTH || height !== VERTICAL_IMAGE_EXPECTED_HEIGHT) {
      return 'create_event.error_vertical_image_dimensions'
    }
    return null
  } catch (error) {
    captureException(error, { tags: { feature: 'create_event', step: 'vertical_image_decode' } })
    return 'create_event.error_vertical_image_decode'
  }
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

function extractSubmitErrorMessage(error: unknown, t: (key: string) => string): string {
  console.error('[CreateEvent] submit failed', error)
  return t('create_event.error_submit')
}

type FormErrors = Partial<Record<string, string>>

/* eslint-disable @typescript-eslint/naming-convention -- keys match form select values */
const FREQUENCY_MAP: Record<string, RecurrentFrequency> = {
  every_day: 'DAILY',
  every_week: 'WEEKLY',
  every_month: 'MONTHLY'
}
/* eslint-enable @typescript-eslint/naming-convention */

type UseCreateEventFormOptions = {
  onSuccess?: () => void
}

function useCreateEventForm({ onSuccess }: UseCreateEventFormOptions = {}) {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const [createEvent] = useCreateEventMutation()
  const [uploadPoster] = useUploadPosterMutation()
  const [uploadPosterVertical] = useUploadPosterVerticalMutation()
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
    async (file: File) => {
      const validationError = validateImage(file)
      if (validationError) {
        setForm(prev => {
          if (prev.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl)
          return { ...prev, imageError: validationError, image: null, imagePreviewUrl: null, imageUrl: null, isUploadingImage: false }
        })
        return
      }
      if (!identity) {
        setForm(prev => ({ ...prev, imageError: 'create_event.error_upload_failed' }))
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setForm(prev => {
        if (prev.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl)
        return {
          ...prev,
          image: file,
          imagePreviewUrl: previewUrl,
          imageError: null,
          imageUrl: null,
          isUploadingImage: true
        }
      })
      try {
        const result = await uploadPoster({ file, identity }).unwrap()
        setForm(prev => {
          if (prev.imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.imagePreviewUrl)
          return { ...prev, imageUrl: result.url, imagePreviewUrl: result.url, isUploadingImage: false }
        })
      } catch {
        setForm(prev => ({ ...prev, isUploadingImage: false, imageError: 'create_event.error_upload_failed' }))
      }
    },
    [identity, uploadPoster]
  )

  const handleImageRemove = useCallback(() => {
    setForm(prev => {
      if (prev.imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.imagePreviewUrl)
      return { ...prev, image: null, imagePreviewUrl: null, imageUrl: null, imageError: null, isUploadingImage: false }
    })
  }, [])

  const handleVerticalImageSelect = useCallback(
    async (file: File) => {
      const validationError = validateVerticalImage(file) ?? (await validateVerticalImageDimensions(file))
      if (validationError) {
        setForm(prev => {
          if (prev.verticalImagePreviewUrl) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
          return {
            ...prev,
            verticalImageError: validationError,
            verticalImage: null,
            verticalImagePreviewUrl: null,
            verticalImageUrl: null,
            isUploadingVerticalImage: false
          }
        })
        return
      }
      if (!identity) {
        setForm(prev => ({ ...prev, verticalImageError: 'create_event.error_upload_failed' }))
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setForm(prev => {
        if (prev.verticalImagePreviewUrl) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
        return {
          ...prev,
          verticalImage: file,
          verticalImagePreviewUrl: previewUrl,
          verticalImageError: null,
          verticalImageUrl: null,
          isUploadingVerticalImage: true
        }
      })
      try {
        const result = await uploadPosterVertical({ file, identity }).unwrap()
        setForm(prev => {
          if (prev.verticalImagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
          return {
            ...prev,
            verticalImageUrl: result.url,
            verticalImagePreviewUrl: result.url,
            isUploadingVerticalImage: false
          }
        })
      } catch {
        setForm(prev => ({
          ...prev,
          isUploadingVerticalImage: false,
          verticalImageError: 'create_event.error_upload_failed'
        }))
      }
    },
    [identity, uploadPosterVertical]
  )

  const handleVerticalImageRemove = useCallback(() => {
    setForm(prev => {
      if (prev.verticalImagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
      return {
        ...prev,
        verticalImage: null,
        verticalImagePreviewUrl: null,
        verticalImageUrl: null,
        verticalImageError: null,
        isUploadingVerticalImage: false
      }
    })
  }, [])

  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = t('create_event.error_required')
    } else if (form.name.length > MAX_NAME_LENGTH) {
      newErrors.name = t('create_event.error_name_too_long')
    }

    if (!form.description.trim()) {
      newErrors.description = t('create_event.error_required')
    } else if (form.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = t('create_event.error_description_too_long')
    }

    if (!form.startDate) newErrors.startDate = t('create_event.error_required')
    if (!form.startTime) newErrors.startTime = t('create_event.error_required')
    if (!form.endDate) newErrors.endDate = t('create_event.error_required')
    if (!form.endTime) newErrors.endTime = t('create_event.error_required')

    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const startMs = new Date(`${form.startDate}T${form.startTime}`).getTime()
      const finishMs = new Date(`${form.endDate}T${form.endTime}`).getTime()
      if (finishMs <= startMs) {
        newErrors.endDate = t('create_event.error_end_before_start')
      } else if (finishMs - startMs > MAX_EVENT_DURATION_MS) {
        newErrors.endDate = t('create_event.error_duration_too_long')
      }
    }

    if (form.location === 'land') {
      if (!isValidCoordinate(form.coordX, COORD_X_MIN, COORD_X_MAX)) {
        newErrors.coordX = t('create_event.error_coord_x_range')
      }
      if (!isValidCoordinate(form.coordY, COORD_Y_MIN, COORD_Y_MAX)) {
        newErrors.coordY = t('create_event.error_coord_y_range')
      }
    } else if (form.location === 'world' && !form.world) {
      newErrors.world = t('create_event.error_required')
    }

    if (!isValidEmail(form.email)) {
      newErrors.email = t('create_event.error_invalid_email')
    }

    if (form.repeatEnabled && !form.repeatEndDate) {
      newErrors.repeatEndDate = t('create_event.error_required')
    }

    return newErrors
  }, [form, t])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    if (!identity) {
      setErrors({ submit: t('create_event.error_not_signed_in') })
      return
    }
    if (form.isUploadingImage || form.isUploadingVerticalImage) return
    if (form.imageError || form.verticalImageError) return

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

      const isWorld = form.location === 'world'
      /* eslint-disable @typescript-eslint/naming-convention */
      await createEvent({
        payload: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          start_at: startAt,
          duration,
          x: isWorld ? 0 : Number(form.coordX),
          y: isWorld ? 0 : Number(form.coordY),
          image: form.imageUrl,
          image_vertical: form.verticalImageUrl,
          contact: form.email || null,
          categories: [],
          world: isWorld || undefined,
          server: isWorld ? form.world : null,
          community_id: form.communityId || null,
          recurrent: form.repeatEnabled || undefined,
          recurrent_frequency: form.repeatEnabled ? FREQUENCY_MAP[form.frequency] : undefined,
          recurrent_until: form.repeatEnabled && form.repeatEndDate ? new Date(`${form.repeatEndDate}T00:00:00`).toISOString() : undefined
        },
        identity
      }).unwrap()
      /* eslint-enable @typescript-eslint/naming-convention */

      onSuccess?.()
    } catch (error) {
      setErrors({ submit: extractSubmitErrorMessage(error, t) })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, identity, isSubmitting, validate, createEvent, t, onSuccess])

  return {
    form,
    errors,
    setField,
    handleImageSelect,
    handleImageRemove,
    handleVerticalImageSelect,
    handleVerticalImageRemove,
    isSubmitting,
    handleSubmit
  }
}

export { useCreateEventForm }
export type { CreateEventFormState, FormErrors }

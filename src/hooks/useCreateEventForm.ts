import { useCallback, useState } from 'react'
import { captureException } from '@sentry/browser'
import { useTranslation } from '@dcl/hooks'
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  useUploadPosterMutation,
  useUploadPosterVerticalMutation
} from '../features/events'
import type { EventEntry } from '../features/events'
import { dayIndicesToWeekdayMask, parseStartWeekday } from '../utils/recurrence'
import { useAuthIdentity } from './useAuthIdentity'
import { FREQUENCY_MAP, INITIAL_STATE, eventEntryToFormState, parseDurationMs, parseRecurrentInterval } from './useCreateEventForm.helpers'
import type { CreateEventFormMode, CreateEventFormState, FormErrors, ImageErrorCode } from './useCreateEventForm.types'

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

function validateImage(file: File): ImageErrorCode | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'invalid_image_type'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'image_too_large'
  }
  return null
}

function validateVerticalImage(file: File): ImageErrorCode | null {
  if (!ACCEPTED_VERTICAL_IMAGE_TYPES.includes(file.type)) {
    return 'invalid_vertical_image_type'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'image_too_large'
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

async function validateVerticalImageDimensions(file: File): Promise<ImageErrorCode | null> {
  try {
    const { width, height } = await readImageDimensions(file)
    if (width !== VERTICAL_IMAGE_EXPECTED_WIDTH || height !== VERTICAL_IMAGE_EXPECTED_HEIGHT) {
      return 'vertical_image_dimensions'
    }
    return null
  } catch (error) {
    captureException(error, { tags: { feature: 'create_event', step: 'vertical_image_decode' } })
    return 'vertical_image_decode'
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

type UseCreateEventFormOptions = {
  onSuccess?: () => void
  initialEvent?: EventEntry | null
  initialCommunityId?: string | null
}

function useCreateEventForm({ onSuccess, initialEvent = null, initialCommunityId = null }: UseCreateEventFormOptions = {}) {
  const { t } = useTranslation()
  const { identity } = useAuthIdentity()
  const [createEvent] = useCreateEventMutation()
  const [updateEvent] = useUpdateEventMutation()
  const [uploadPoster] = useUploadPosterMutation()
  const [uploadPosterVertical] = useUploadPosterVerticalMutation()
  const mode: CreateEventFormMode = initialEvent ? 'edit' : 'create'
  const [form, setForm] = useState<CreateEventFormState>(() => {
    if (initialEvent) return eventEntryToFormState(initialEvent)
    return initialCommunityId ? { ...INITIAL_STATE, communityId: initialCommunityId } : INITIAL_STATE
  })
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

  const markRequiredFields = useCallback(
    (fields: Array<keyof CreateEventFormState>) => {
      if (fields.length === 0) return
      setErrors(prev => {
        const next = { ...prev }
        fields.forEach(field => {
          next[field as string] = t('create_event.error_required')
        })
        return next
      })
    },
    [t]
  )

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
        setForm(prev => ({ ...prev, imageError: 'upload_failed' }))
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
        setForm(prev => ({ ...prev, isUploadingImage: false, imageError: 'upload_failed' }))
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
        setForm(prev => ({ ...prev, verticalImageError: 'upload_failed' }))
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
          verticalImageError: 'upload_failed'
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
    if (!form.duration) {
      newErrors.duration = t('create_event.error_required')
    } else {
      const durationMs = parseDurationMs(form.duration)
      if (durationMs === null) {
        newErrors.duration = t('create_event.error_duration_invalid')
      } else if (durationMs > MAX_EVENT_DURATION_MS) {
        newErrors.duration = t('create_event.error_duration_too_long')
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

    if (form.repeatEnabled) {
      if (!form.repeatEndDate) {
        newErrors.repeatEndDate = t('create_event.error_required')
      }
      if (form.frequency === 'every_week') {
        if (parseRecurrentInterval(form.repeatInterval) === null) {
          newErrors.repeatInterval = t('create_event.error_repeat_interval_invalid')
        }
        if (form.repeatDays.length === 0) {
          newErrors.repeatDays = t('create_event.error_repeat_days_required')
        } else {
          const startWeekday = parseStartWeekday(form.startDate)
          if (startWeekday !== null && !form.repeatDays.includes(startWeekday)) {
            newErrors.repeatDays = t('create_event.error_start_date_not_in_repeat_days')
          }
        }
      }
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
    const imageMissing = !form.imageUrl
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
    }
    if (imageMissing) {
      setForm(prev => ({ ...prev, imageError: 'image_required' }))
    }
    if (Object.keys(validationErrors).length > 0 || imageMissing) {
      return
    }

    setIsSubmitting(true)
    try {
      const startAt = new Date(`${form.startDate}T${form.startTime}`).toISOString()
      const duration = parseDurationMs(form.duration) ?? 0

      const isWorld = form.location === 'world'
      /* eslint-disable @typescript-eslint/naming-convention */
      const payload = {
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
        // Always send the explicit boolean. Earlier this was `isWorld || undefined`,
        // which omits the field on PATCH and lets the backend keep its previous
        // value — that's how events with `world: true` (set wrongly in an earlier
        // edit) survived a switch back to Land: the user picked Land, saved, but
        // the PATCH never carried `world: false` to clear the stale flag.
        world: isWorld,
        server: isWorld ? form.world : null,
        community_id: form.communityId || null,
        recurrent: form.repeatEnabled || undefined,
        recurrent_frequency: form.repeatEnabled ? FREQUENCY_MAP[form.frequency] : undefined,
        recurrent_interval: form.repeatEnabled
          ? form.frequency === 'every_week'
            ? parseRecurrentInterval(form.repeatInterval) ?? 1
            : 1
          : undefined,
        // Mask only goes on the wire for WEEKLY — for DAILY/MONTHLY (and non-recurrent events) we omit
        // it so the server's schema default (0) takes effect and the RRule defaults to start_at's weekday.
        recurrent_weekday_mask:
          form.repeatEnabled && form.frequency === 'every_week' ? dayIndicesToWeekdayMask(form.repeatDays) : undefined,
        recurrent_until: form.repeatEnabled && form.repeatEndDate ? new Date(`${form.repeatEndDate}T00:00:00`).toISOString() : undefined
      }
      /* eslint-enable @typescript-eslint/naming-convention */

      if (initialEvent) {
        // NOTE: clearing rejected on edit moves the event back to pending so a moderator can re-evaluate.
        // The backend keeps the prior value when the body omits the field.

        const updatePayload = initialEvent.rejected ? { ...payload, rejected: false } : payload
        await updateEvent({ eventId: initialEvent.id, payload: updatePayload, identity }).unwrap()
      } else {
        await createEvent({ payload, identity }).unwrap()
      }

      onSuccess?.()
    } catch (error) {
      setErrors({ submit: extractSubmitErrorMessage(error, t) })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, identity, isSubmitting, initialEvent, validate, createEvent, updateEvent, t, onSuccess])

  return {
    form,
    errors,
    mode,
    setField,
    markRequiredFields,
    handleImageSelect,
    handleImageRemove,
    handleVerticalImageSelect,
    handleVerticalImageRemove,
    isSubmitting,
    handleSubmit
  }
}

export { useCreateEventForm }

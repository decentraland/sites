import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  useUploadPosterMutation,
  useUploadPosterVerticalMutation
} from '../features/events'
import type { EventEntry } from '../features/events'
import { compressImageFile } from '../utils/imageCompression'
import { useAdminPermissions } from './useAdminPermissions'
import { useAuthIdentity } from './useAuthIdentity'
import {
  INITIAL_STATE,
  eventEntryToFormState,
  hasModeratedContentChanged,
  isValidFeaturedItemUrn,
  localDateToEndOfDayIso,
  parseDurationMs,
  recurrenceToApi
} from './useCreateEventForm.helpers'
import type { CreateEventFormMode, CreateEventFormState, FormErrors, ImageErrorCode } from './useCreateEventForm.types'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif']
const ACCEPTED_VERTICAL_IMAGE_TYPES = ['image/png', 'image/jpeg']
const MAX_IMAGE_SIZE_BYTES = 500 * 1024
const COVER_RECOMMENDED_WIDTH = 1340
const COVER_RECOMMENDED_HEIGHT = 670
const VERTICAL_IMAGE_EXPECTED_WIDTH = 716
const VERTICAL_IMAGE_EXPECTED_HEIGHT = 1814

const COORD_X_MIN = -150
const COORD_X_MAX = 163
const COORD_Y_MIN = -150
const COORD_Y_MAX = 158

const MAX_EVENT_DURATION_MS = 24 * 60 * 60 * 1000
const MAX_NAME_LENGTH = 150
const MAX_DESCRIPTION_LENGTH = 5000

function validateImageType(file: File, accepted: string[], invalidCode: ImageErrorCode): ImageErrorCode | null {
  if (!accepted.includes(file.type)) {
    return invalidCode
  }
  return null
}

// Re-encode every selected cover to WebP (falling back to JPEG when the browser
// can't encode WebP), shrinking past 500 KB when needed. When the source can't
// be re-encoded at all (animated GIF, or a decoder/canvas failure) we keep the
// original if it already fits and only reject when it's both unconvertible and
// over the limit.
async function prepareImageUpload(
  file: File,
  options: { cover?: { width: number; height: number }; preserveDimensions?: boolean }
): Promise<{ file: File; error: ImageErrorCode | null }> {
  const converted = await compressImageFile(file, { ...options, maxBytes: MAX_IMAGE_SIZE_BYTES })
  if (converted) {
    return { file: converted, error: null }
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { file, error: 'image_too_large' }
  }
  return { file, error: null }
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
    // Lazy-import keeps `@sentry/browser` (~120 KB gzip) off the critical path
    // until the user actually uploads a malformed vertical poster.
    void import('@sentry/browser').then(({ captureException }) => {
      captureException(error, { tags: { feature: 'create_event', step: 'vertical_image_decode' } })
    })
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
  const { identity, address } = useAuthIdentity()
  const { isAdmin, canApproveAnyEvent, canApproveOwnEvent } = useAdminPermissions()
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
      const typeError = validateImageType(file, ACCEPTED_IMAGE_TYPES, 'invalid_image_type')
      if (typeError) {
        setForm(prev => {
          if (prev.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl)
          return { ...prev, imageError: typeError, image: null, imagePreviewUrl: null, imageUrl: null, isUploadingImage: false }
        })
        return
      }
      if (!identity) {
        setForm(prev => ({ ...prev, imageError: 'upload_failed' }))
        return
      }
      // Show the original immediately and flag uploading before the async
      // re-encode so the form's submit guard sees the in-flight state.
      const previewUrl = URL.createObjectURL(file)
      setForm(prev => {
        if (prev.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl)
        return { ...prev, image: file, imagePreviewUrl: previewUrl, imageError: null, imageUrl: null, isUploadingImage: true }
      })
      const { file: uploadable, error: prepError } = await prepareImageUpload(file, {
        cover: { width: COVER_RECOMMENDED_WIDTH, height: COVER_RECOMMENDED_HEIGHT }
      })
      if (prepError) {
        setForm(prev => {
          if (prev.imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.imagePreviewUrl)
          return { ...prev, imageError: prepError, image: null, imagePreviewUrl: null, imageUrl: null, isUploadingImage: false }
        })
        return
      }
      try {
        const result = await uploadPoster({ file: uploadable, identity }).unwrap()
        setForm(prev => {
          if (prev.imagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.imagePreviewUrl)
          return { ...prev, image: uploadable, imageUrl: result.url, imagePreviewUrl: result.url, isUploadingImage: false }
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
      const typeError = validateImageType(file, ACCEPTED_VERTICAL_IMAGE_TYPES, 'invalid_vertical_image_type')
      if (typeError) {
        setForm(prev => {
          if (prev.verticalImagePreviewUrl) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
          return {
            ...prev,
            verticalImageError: typeError,
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
      // Preserve dimensions: the 716×1814 requirement is validated right after.
      const { file: uploadable, error: prepError } = await prepareImageUpload(file, { preserveDimensions: true })
      const validationError = prepError ?? (await validateVerticalImageDimensions(uploadable))
      if (validationError) {
        setForm(prev => {
          if (prev.verticalImagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
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
      try {
        const result = await uploadPosterVertical({ file: uploadable, identity }).unwrap()
        setForm(prev => {
          if (prev.verticalImagePreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(prev.verticalImagePreviewUrl)
          return {
            ...prev,
            verticalImage: uploadable,
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

    if (form.featuredItem.trim() && !isValidFeaturedItemUrn(form.featuredItem.trim())) {
      newErrors.featuredItem = t('create_event.error_invalid_featured_item')
    }

    if (!isValidEmail(form.email)) {
      newErrors.email = t('create_event.error_invalid_email')
    }

    // NOTE: the per-weekday picker and the standalone interval validation were removed (#560). The
    // combined recurrence selector only yields valid (frequency, interval) pairs, and the weekly
    // weekday is now derived from start_at, so the only thing left to validate is the end date.
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
      const recurrenceApi = form.repeatEnabled ? recurrenceToApi(form.recurrence) : null
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
        featured_item: form.featuredItem.trim() || null,
        recurrent: form.repeatEnabled || undefined,
        recurrent_frequency: recurrenceApi?.frequency,
        recurrent_interval: recurrenceApi?.interval,
        // NOTE: send an explicit 0 (not undefined) whenever the event is recurrent (#560). 0 makes the
        // server's RRule default BYDAY to start_at's own weekday, so a weekly/biweekly event recurs on
        // exactly that one day. Sending it explicitly also CLEARS any stale per-weekday mask on edit —
        // omitting the field on a PATCH would let the backend keep the old mask, which is how a Tuesday
        // event ended up also showing every Wednesday. Omit it only when the event isn't recurrent.
        recurrent_weekday_mask: form.repeatEnabled ? 0 : undefined,
        recurrent_until: form.repeatEnabled && form.repeatEndDate ? localDateToEndOfDayIso(form.repeatEndDate) ?? undefined : undefined
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

  // Warn the owner before a save that would bounce an already-approved hangout back to moderation:
  // true only while editing an approved event whose moderated content differs from the saved copy
  // (see `hasModeratedContentChanged` + the backend re-moderation gate). Mirrors the backend's
  // actor-can-approve exemption — moderators / self-approvers keep the event approved on edit, so
  // they shouldn't see the warning.
  const isOwner = !!address && !!initialEvent && address.toLowerCase() === initialEvent.user.toLowerCase()
  const actorCanApprove = isAdmin || canApproveAnyEvent || (isOwner && canApproveOwnEvent)
  const requiresModerationReview = useMemo(
    () => Boolean(initialEvent?.approved) && !actorCanApprove && hasModeratedContentChanged(form, initialEvent),
    [initialEvent, form, actorCanApprove]
  )

  return {
    form,
    errors,
    mode,
    requiresModerationReview,
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

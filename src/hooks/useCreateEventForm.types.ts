type ImageErrorCode =
  | 'invalid_image_type'
  | 'invalid_vertical_image_type'
  | 'image_too_large'
  | 'upload_failed'
  | 'vertical_image_dimensions'
  | 'vertical_image_decode'
  | 'image_required'

type CreateEventFormState = {
  image: File | null
  imagePreviewUrl: string | null
  imageUrl: string | null
  imageError: ImageErrorCode | null
  isUploadingImage: boolean
  verticalImage: File | null
  verticalImagePreviewUrl: string | null
  verticalImageUrl: string | null
  verticalImageError: ImageErrorCode | null
  isUploadingVerticalImage: boolean
  name: string
  description: string
  startDate: string
  startTime: string
  duration: string
  repeatEnabled: boolean
  // Single combined recurrence option (every_day | every_week | every_2_weeks | every_3_weeks |
  // every_4_weeks | every_month). It folds the legacy frequency + interval pair into one selector.
  recurrence: string
  // LOCAL weekday indices (Sun=0..Sat=6) the event repeats on, for weekly cadences. The start date's
  // weekday is always part of the recurrence even if absent here (see effectiveWeekdays); empty means
  // "just the start day". Ignored for daily/monthly cadences.
  repeatDays: number[]
  repeatEndDate: string
  location: string
  coordX: string
  coordY: string
  world: string
  communityId: string
  email: string
}

type FormErrors = Partial<Record<string, string>>

type CreateEventFormMode = 'create' | 'edit'

export type { CreateEventFormMode, CreateEventFormState, FormErrors, ImageErrorCode }

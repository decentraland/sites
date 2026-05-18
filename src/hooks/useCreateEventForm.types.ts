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
  frequency: string
  repeatInterval: string
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

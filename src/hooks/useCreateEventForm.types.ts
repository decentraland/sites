type ImageErrorCode =
  | 'invalid_image_type'
  | 'invalid_vertical_image_type'
  | 'image_too_large'
  | 'upload_failed'
  | 'vertical_image_dimensions'
  | 'vertical_image_decode'

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

type FormErrors = Partial<Record<string, string>>

export type { CreateEventFormState, FormErrors, ImageErrorCode }

// eslint-disable-next-line @typescript-eslint/naming-convention
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { useTranslation } from '@dcl/hooks'
import type { ImageErrorCode } from '../../../hooks/useCreateEventForm.types'
import { ErrorIcon, ErrorRow, ErrorText, OptimizeLink } from './shared.styled'

const OPTIMIZE_IMAGE_URL = 'https://imagecompressor.com/'

/* eslint-disable @typescript-eslint/naming-convention -- keys match ImageErrorCode union */
const IMAGE_ERROR_I18N = {
  invalid_image_type: 'create_event.error_invalid_image_type',
  invalid_vertical_image_type: 'create_event.error_invalid_vertical_image_type',
  image_too_large: 'create_event.error_image_too_large',
  upload_failed: 'create_event.error_upload_failed',
  vertical_image_dimensions: 'create_event.error_vertical_image_dimensions',
  vertical_image_decode: 'create_event.error_vertical_image_decode',
  image_required: 'create_event.error_image_required'
} as const satisfies Record<ImageErrorCode, string>
/* eslint-enable @typescript-eslint/naming-convention */

type ImageErrorMessageProps = {
  code: ImageErrorCode
}

function ImageErrorMessage({ code }: ImageErrorMessageProps) {
  const { t } = useTranslation()

  return (
    <ErrorRow>
      <ErrorIcon>
        <ErrorOutlineIcon />
      </ErrorIcon>
      <ErrorText>
        {t(IMAGE_ERROR_I18N[code])}
        {code === 'image_too_large' && (
          <>
            {' '}
            <OptimizeLink href={OPTIMIZE_IMAGE_URL} target="_blank" rel="noreferrer">
              {t('create_event.optimize_link')}
            </OptimizeLink>
          </>
        )}
      </ErrorText>
    </ErrorRow>
  )
}

export { ImageErrorMessage, IMAGE_ERROR_I18N }
export type { ImageErrorMessageProps }

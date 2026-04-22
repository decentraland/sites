import { render, screen } from '@testing-library/react'
import type { ImageErrorCode } from '../../../hooks/useCreateEventForm.types'
import { IMAGE_ERROR_I18N, ImageErrorMessage } from './ImageErrorMessage'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@mui/icons-material/ErrorOutline', () => ({
  __esModule: true,
  default: () => <span data-testid="error-outline-icon" />
}))

jest.mock('./shared.styled', () => ({
  ErrorIcon: ({ children }: { children: React.ReactNode }) => <span data-testid="error-icon">{children}</span>,
  ErrorRow: ({ children }: { children: React.ReactNode }) => <div data-testid="error-row">{children}</div>,
  ErrorText: ({ children }: { children: React.ReactNode }) => <span data-testid="error-text">{children}</span>,
  OptimizeLink: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a data-testid="optimize-link" {...props}>
      {children}
    </a>
  )
}))

describe('ImageErrorMessage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each(Object.entries(IMAGE_ERROR_I18N) as Array<[ImageErrorCode, string]>)('when the code is %s', (code, key) => {
    it('should render the matching i18n key inside the error text', () => {
      render(<ImageErrorMessage code={code} />)

      expect(screen.getByTestId('error-text')).toHaveTextContent(key)
    })
  })

  describe('when the code is image_too_large', () => {
    it('should render the optimize link with the imagecompressor href', () => {
      render(<ImageErrorMessage code="image_too_large" />)

      const link = screen.getByTestId('optimize-link')
      expect(link).toHaveAttribute('href', 'https://imagecompressor.com/')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('when the code is not image_too_large', () => {
    it('should not render the optimize link', () => {
      render(<ImageErrorMessage code="invalid_image_type" />)

      expect(screen.queryByTestId('optimize-link')).not.toBeInTheDocument()
    })
  })
})

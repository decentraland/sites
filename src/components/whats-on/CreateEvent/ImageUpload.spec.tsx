import { fireEvent, render, screen } from '@testing-library/react'
import { ImageUpload } from './ImageUpload'
import type { ImageUploadProps } from './ImageUpload'

jest.mock('./ImageUpload.styled', () => ({
  CameraIcon: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChooseLink: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children: React.ReactNode }) => (
    <span data-testid="choose-link" {...props}>
      {children}
    </span>
  ),
  DropHintText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DropZone: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; $hasImage: boolean; $hasError: boolean }) => {
    const { $hasImage: _hasImage, $hasError: _hasError, ...rest } = props as Record<string, unknown>
    return (
      <div data-testid="drop-zone" {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    )
  },
  DropZoneContent: ({ children }: { children: React.ReactNode }) => <div data-testid="drop-zone-content">{children}</div>,
  ErrorIcon: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  ErrorRow: ({ children }: { children: React.ReactNode }) => <div data-testid="error-row">{children}</div>,
  ErrorText: ({ children }: { children: React.ReactNode }) => <span data-testid="error-text">{children}</span>,
  HelperIcon: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  HelperRow: ({ children }: { children: React.ReactNode }) => <div data-testid="helper-row">{children}</div>,
  HelperText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IconAndTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  OptimizeLink: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a data-testid="optimize-link" {...props}>
      {children}
    </a>
  ),
  OverlayText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  PreviewImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="preview-image" {...props} />,
  PreviewOverlay: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div data-testid="preview-overlay" {...props}>
      {children}
    </div>
  ),
  RecommendedSize: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SelectText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  UploadHintGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@mui/icons-material/ErrorOutline', () => ({
  __esModule: true,
  default: () => <span data-testid="error-outline-icon" />
}))

jest.mock('@mui/icons-material/InfoOutlined', () => ({
  __esModule: true,
  default: () => <span data-testid="info-icon" />
}))

jest.mock('@mui/icons-material/PhotoCamera', () => ({
  __esModule: true,
  default: () => <span data-testid="camera-icon" />
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('ImageUpload', () => {
  let props: ImageUploadProps

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no image is uploaded', () => {
    beforeEach(() => {
      props = {
        imagePreviewUrl: null,
        imageError: null,
        onImageSelect: jest.fn(),
        onImageRemove: jest.fn()
      }
    })

    it('should render the empty drop zone', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('drop-zone-content')).toBeInTheDocument()
    })

    it('should not render the preview image', () => {
      render(<ImageUpload {...props} />)

      expect(screen.queryByTestId('preview-image')).not.toBeInTheDocument()
    })

    it('should render the drop zone with button role', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByRole('button', { name: 'create_event.image_upload_label' })).toBeInTheDocument()
    })
  })

  describe('when an image is uploaded', () => {
    beforeEach(() => {
      props = {
        imagePreviewUrl: 'blob:http://localhost/test-image',
        imageError: null,
        onImageSelect: jest.fn(),
        onImageRemove: jest.fn()
      }
    })

    it('should render the preview image', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('preview-image')).toBeInTheDocument()
    })

    it('should render the preview image with the correct src', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('preview-image')).toHaveAttribute('src', 'blob:http://localhost/test-image')
    })

    it('should not render the empty drop zone content', () => {
      render(<ImageUpload {...props} />)

      expect(screen.queryByTestId('drop-zone-content')).not.toBeInTheDocument()
    })

    it('should render the preview overlay', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('preview-overlay')).toBeInTheDocument()
    })
  })

  describe('when a file is selected via input', () => {
    let mockOnImageSelect: jest.Mock

    beforeEach(() => {
      mockOnImageSelect = jest.fn()
      props = {
        imagePreviewUrl: null,
        imageError: null,
        onImageSelect: mockOnImageSelect,
        onImageRemove: jest.fn()
      }
    })

    it('should call onImageSelect', () => {
      render(<ImageUpload {...props} />)

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      expect(mockOnImageSelect).toHaveBeenCalledWith(file)
    })
  })

  describe('when there is an invalid image type error', () => {
    beforeEach(() => {
      props = {
        imagePreviewUrl: null,
        imageError: 'invalid_image_type',
        onImageSelect: jest.fn(),
        onImageRemove: jest.fn()
      }
    })

    it('should display the translated error message', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('error-text')).toHaveTextContent('create_event.error_invalid_image_type')
    })

    it('should render the error row and hide the helper row', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('error-row')).toBeInTheDocument()
      expect(screen.queryByTestId('helper-row')).not.toBeInTheDocument()
    })

    it('should not render the optimize link', () => {
      render(<ImageUpload {...props} />)

      expect(screen.queryByTestId('optimize-link')).not.toBeInTheDocument()
    })
  })

  describe('when the image is too large', () => {
    beforeEach(() => {
      props = {
        imagePreviewUrl: null,
        imageError: 'image_too_large',
        onImageSelect: jest.fn(),
        onImageRemove: jest.fn()
      }
    })

    it('should render the error row with the optimize link', () => {
      render(<ImageUpload {...props} />)

      const link = screen.getByTestId('optimize-link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://imagecompressor.com/')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('when there is no error', () => {
    beforeEach(() => {
      props = {
        imagePreviewUrl: null,
        imageError: null,
        onImageSelect: jest.fn(),
        onImageRemove: jest.fn()
      }
    })

    it('should render the helper row', () => {
      render(<ImageUpload {...props} />)

      expect(screen.getByTestId('helper-row')).toBeInTheDocument()
    })

    it('should not render the error row', () => {
      render(<ImageUpload {...props} />)

      expect(screen.queryByTestId('error-row')).not.toBeInTheDocument()
    })
  })
})

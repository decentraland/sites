import { fireEvent, render, screen } from '@testing-library/react'
import { VerticalCoverPanel } from './VerticalCoverPanel'
import type { VerticalCoverPanelProps } from './VerticalCoverPanel'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@mui/icons-material/PhotoCamera', () => ({
  __esModule: true,
  default: () => <span data-testid="camera-icon" />
}))

jest.mock('./VerticalCoverPanel.styled', () => ({
  CameraIcon: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChooseLink: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children: React.ReactNode }) => (
    <span data-testid="choose-link" {...props}>
      {children}
    </span>
  ),
  DropZone: ({
    children,
    $hasImage,
    ...rest
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; $hasImage: boolean }) => (
    <div data-testid="drop-zone" data-has-image={$hasImage} {...rest}>
      {children}
    </div>
  ),
  DropZoneContent: ({ children }: { children: React.ReactNode }) => <div data-testid="drop-zone-content">{children}</div>,
  HintGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HintText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  IconAndTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  OverlayText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  PanelContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PreviewImage: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img data-testid="preview-image" {...props} />,
  PreviewOverlay: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div data-testid="preview-overlay" {...props}>
      {children}
    </div>
  ),
  RecommendedSize: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SelectText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

describe('VerticalCoverPanel', () => {
  let props: VerticalCoverPanelProps

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no preview exists', () => {
    beforeEach(() => {
      props = {
        previewUrl: null,
        onSelect: jest.fn(),
        onRemove: jest.fn()
      }
    })

    it('should render the empty drop zone content', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.getByTestId('drop-zone-content')).toBeInTheDocument()
    })

    it('should not render a preview image', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.queryByTestId('preview-image')).not.toBeInTheDocument()
    })

    it('should not render the preview overlay', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.queryByTestId('preview-overlay')).not.toBeInTheDocument()
    })

    it('should mark the drop zone as not having an image', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.getByTestId('drop-zone')).toHaveAttribute('data-has-image', 'false')
    })
  })

  describe('when a preview url is provided', () => {
    beforeEach(() => {
      props = {
        previewUrl: 'https://cdn.example.com/vertical.jpg',
        onSelect: jest.fn(),
        onRemove: jest.fn()
      }
    })

    it('should render the preview image with the provided src', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.getByTestId('preview-image')).toHaveAttribute('src', 'https://cdn.example.com/vertical.jpg')
    })

    it('should render the preview overlay', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.getByTestId('preview-overlay')).toBeInTheDocument()
    })

    it('should not render the empty drop zone content', () => {
      render(<VerticalCoverPanel {...props} />)

      expect(screen.queryByTestId('drop-zone-content')).not.toBeInTheDocument()
    })
  })

  describe('when a file is selected through the hidden input', () => {
    let mockOnSelect: jest.Mock

    beforeEach(() => {
      mockOnSelect = jest.fn()
      props = {
        previewUrl: null,
        onSelect: mockOnSelect,
        onRemove: jest.fn()
      }
    })

    it('should call onSelect with the chosen file', () => {
      const { container } = render(<VerticalCoverPanel {...props} />)

      const file = new File(['vertical'], 'vertical.png', { type: 'image/png' })
      const input = container.querySelector<HTMLInputElement>('input[type="file"]')
      expect(input).not.toBeNull()
      fireEvent.change(input!, { target: { files: [file] } })

      expect(mockOnSelect).toHaveBeenCalledWith(file)
    })
  })

  describe('when a file is dropped on the drop zone', () => {
    let mockOnSelect: jest.Mock

    beforeEach(() => {
      mockOnSelect = jest.fn()
      props = {
        previewUrl: null,
        onSelect: mockOnSelect,
        onRemove: jest.fn()
      }
    })

    it('should call onSelect with the dropped file', () => {
      render(<VerticalCoverPanel {...props} />)

      const file = new File(['vertical'], 'vertical.jpg', { type: 'image/jpeg' })
      fireEvent.drop(screen.getByTestId('drop-zone'), {
        dataTransfer: { files: [file] }
      })

      expect(mockOnSelect).toHaveBeenCalledWith(file)
    })
  })

  describe('when the preview overlay is clicked', () => {
    let mockOnRemove: jest.Mock

    beforeEach(() => {
      mockOnRemove = jest.fn()
      props = {
        previewUrl: 'https://cdn.example.com/vertical.jpg',
        onSelect: jest.fn(),
        onRemove: mockOnRemove
      }
    })

    it('should call onRemove', () => {
      render(<VerticalCoverPanel {...props} />)

      fireEvent.click(screen.getByTestId('preview-overlay'))

      expect(mockOnRemove).toHaveBeenCalled()
    })
  })
})

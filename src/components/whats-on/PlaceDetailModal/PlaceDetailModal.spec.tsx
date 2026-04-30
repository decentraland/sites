import { render, screen } from '@testing-library/react'
import { PlaceDetailModal } from './PlaceDetailModal'
import type { ModalPlaceData } from './PlaceDetailModal.types'

jest.mock('../EventDetailModal/EventDetailModal.styled', () => ({
  StyledDialog: ({ children, open, ...props }: { children: React.ReactNode; open: boolean; 'aria-labelledby'?: string }) =>
    open ? (
      <div data-testid="dialog" aria-labelledby={props['aria-labelledby']}>
        {children}
      </div>
    ) : null
}))

jest.mock('./PlaceDetailModalHero', () => ({
  PlaceDetailModalHero: ({ data, onClose }: { data: ModalPlaceData; onClose: () => void }) => (
    <div data-testid="hero" data-title={data.title}>
      <button data-testid="close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  )
}))

jest.mock('./PlaceDetailModalContent', () => ({
  PlaceDetailModalContent: ({ data }: { data: ModalPlaceData }) => <div data-testid="content" data-title={data.title} />
}))

function createMockPlaceData(overrides: Partial<ModalPlaceData> = {}): ModalPlaceData {
  return {
    id: 'place-1',
    title: 'Genesis Plaza',
    description: 'Heart of Decentraland',
    image: 'https://example.com/place.png',
    coordinates: [10, 20],
    ownerAddress: '0xOwner',
    ownerName: 'Owner',
    favorites: 100,
    userCount: 5,
    isWorld: false,
    worldName: null,
    ...overrides
  }
}

describe('PlaceDetailModal', () => {
  let mockOnClose: jest.Mock

  beforeEach(() => {
    mockOnClose = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when open is true and data is provided', () => {
    it('should render the dialog with the correct aria-labelledby', () => {
      render(<PlaceDetailModal open={true} onClose={mockOnClose} data={createMockPlaceData()} />)

      expect(screen.getByTestId('dialog')).toHaveAttribute('aria-labelledby', 'place-detail-title')
    })

    it('should render the hero section', () => {
      render(<PlaceDetailModal open={true} onClose={mockOnClose} data={createMockPlaceData()} />)

      expect(screen.getByTestId('hero')).toHaveAttribute('data-title', 'Genesis Plaza')
    })

    it('should render the content section', () => {
      render(<PlaceDetailModal open={true} onClose={mockOnClose} data={createMockPlaceData()} />)

      expect(screen.getByTestId('content')).toHaveAttribute('data-title', 'Genesis Plaza')
    })
  })

  describe('when open is false', () => {
    it('should not render the dialog', () => {
      render(<PlaceDetailModal open={false} onClose={mockOnClose} data={createMockPlaceData()} />)

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when data is null', () => {
    it('should not render the dialog', () => {
      render(<PlaceDetailModal open={true} onClose={mockOnClose} data={null} />)

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })
})

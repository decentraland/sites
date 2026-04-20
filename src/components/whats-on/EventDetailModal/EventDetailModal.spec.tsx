import { render, screen } from '@testing-library/react'
import { createMockModalData } from '../../../__test-utils__/factories'
import { EventDetailModal } from './EventDetailModal'
import type { ModalEventData } from './EventDetailModal.types'

jest.mock('./EventDetailModal.styled', () => ({
  StyledDialog: ({ children, open, ...props }: { children: React.ReactNode; open: boolean; 'aria-labelledby'?: string }) =>
    open ? (
      <div data-testid="dialog" aria-labelledby={props['aria-labelledby']}>
        {children}
      </div>
    ) : null
}))

jest.mock('./EventDetailModalHero', () => ({
  EventDetailModalHero: ({ data, onClose }: { data: ModalEventData; onClose: () => void }) => (
    <div data-testid="hero" data-name={data.name}>
      <button data-testid="close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  )
}))

jest.mock('./EventDetailModalContent', () => ({
  EventDetailModalContent: ({ data }: { data: ModalEventData }) => <div data-testid="content" data-name={data.name} />
}))

describe('EventDetailModal', () => {
  let mockOnClose: jest.Mock

  beforeEach(() => {
    mockOnClose = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when open is true and data is provided', () => {
    it('should render the dialog', () => {
      render(<EventDetailModal open={true} onClose={mockOnClose} data={createMockModalData()} />)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    it('should render the hero section', () => {
      render(<EventDetailModal open={true} onClose={mockOnClose} data={createMockModalData()} />)

      expect(screen.getByTestId('hero')).toBeInTheDocument()
    })

    it('should render the content section', () => {
      render(<EventDetailModal open={true} onClose={mockOnClose} data={createMockModalData()} />)

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('should have the correct aria-labelledby', () => {
      render(<EventDetailModal open={true} onClose={mockOnClose} data={createMockModalData()} />)

      expect(screen.getByTestId('dialog')).toHaveAttribute('aria-labelledby', 'event-detail-title')
    })
  })

  describe('when open is false', () => {
    it('should not render the dialog', () => {
      render(<EventDetailModal open={false} onClose={mockOnClose} data={createMockModalData()} />)

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })

  describe('when data is null', () => {
    it('should not render the dialog', () => {
      render(<EventDetailModal open={true} onClose={mockOnClose} data={null} />)

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
    })
  })
})

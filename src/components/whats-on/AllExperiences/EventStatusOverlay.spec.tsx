import { render, screen } from '@testing-library/react'
import { createMockEvent } from '../../../__test-utils__/factories'
import { EventStatusOverlay } from './EventStatusOverlay'

jest.mock('../PendingEventCard/PendingEventCard.styled', () => ({
  CardFrame: ({ children }: { children: React.ReactNode }) => <div data-testid="card-frame">{children}</div>,
  ChipOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="chip-overlay">{children}</div>,
  StatusChip: ({ children, status }: { children: React.ReactNode; status: string }) => (
    <span data-testid="status-chip" data-status={status}>
      {children}
    </span>
  )
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'my_experiences.status_pending': 'Pending',
        'my_experiences.status_rejected': 'Rejected'
      }
      return translations[key] ?? key
    }
  })
}))

describe('EventStatusOverlay', () => {
  describe('when the event is approved', () => {
    it('should render children without any overlay or chip', () => {
      render(
        <EventStatusOverlay event={createMockEvent({ approved: true, rejected: false })}>
          <div data-testid="child-card" />
        </EventStatusOverlay>
      )

      expect(screen.getByTestId('child-card')).toBeInTheDocument()
      expect(screen.queryByTestId('chip-overlay')).not.toBeInTheDocument()
      expect(screen.queryByTestId('status-chip')).not.toBeInTheDocument()
    })
  })

  describe('when the event is pending', () => {
    it('should wrap children and render the Pending chip', () => {
      render(
        <EventStatusOverlay event={createMockEvent({ approved: false, rejected: false })}>
          <div data-testid="child-card" />
        </EventStatusOverlay>
      )

      expect(screen.getByTestId('child-card')).toBeInTheDocument()
      expect(screen.getByTestId('status-chip')).toHaveAttribute('data-status', 'pending')
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  describe('when the event is rejected', () => {
    it('should wrap children and render the Rejected chip', () => {
      render(
        <EventStatusOverlay event={createMockEvent({ approved: false, rejected: true })}>
          <div data-testid="child-card" />
        </EventStatusOverlay>
      )

      expect(screen.getByTestId('status-chip')).toHaveAttribute('data-status', 'rejected')
      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })
  })
})

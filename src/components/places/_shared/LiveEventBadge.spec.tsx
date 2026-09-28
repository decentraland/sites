import React from 'react'
import { render, screen } from '@testing-library/react'
// Import through the barrel so the re-export contract is exercised too.
import { LiveEventBadge } from '.'

// Run the real *.styled.ts through the shared styled shim instead of the emotion
// engine (decentraland-ui2 ships ESM Jest can't transform), and stand in for the
// badge and the tooltip so the assertions are about this component's wiring.
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    LiveBadge: () => React.createElement('div', { 'data-testid': 'live-badge' }, 'LIVE'),
    Tooltip: ({ title, children, ...rest }: { title?: React.ReactNode; children?: React.ReactNode } & Record<string, unknown>) =>
      React.createElement(
        'div',
        {
          'data-testid': 'tooltip',
          'data-title': String(title ?? ''),
          'data-arrow': String(rest.arrow),
          'data-placement': String(rest.placement)
        },
        children
      )
  }
})

describe('LiveEventBadge', () => {
  describe('when the place has no event title', () => {
    it('should render the badge on its own', () => {
      render(<LiveEventBadge />)

      expect(screen.getByTestId('live-badge')).toBeInTheDocument()
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('should render the badge on its own for an empty title', () => {
      render(<LiveEventBadge eventName="" />)

      expect(screen.getByTestId('live-badge')).toBeInTheDocument()
      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })
  })

  describe('when the place has an event title', () => {
    it('should wrap the badge in a tooltip carrying the event name', () => {
      render(<LiveEventBadge eventName="Watch Party Wednesdays" />)

      const tooltip = screen.getByTestId('tooltip')

      expect(tooltip).toHaveAttribute('data-title', 'Watch Party Wednesdays')
      expect(tooltip).toContainElement(screen.getByTestId('live-badge'))
    })

    it('should point the tooltip above the badge with an arrow', () => {
      render(<LiveEventBadge eventName="Watch Party Wednesdays" />)

      const tooltip = screen.getByTestId('tooltip')

      expect(tooltip).toHaveAttribute('data-placement', 'top')
      expect(tooltip).toHaveAttribute('data-arrow', 'true')
    })

    it('should give the tooltip a real DOM node to hold its ref and listeners', () => {
      // MUI hands the trigger a ref plus the pointer handlers, and ui2's
      // LiveBadge is not guaranteed to forward one, so the badge travels
      // inside a wrapper element rather than as the direct child.
      render(<LiveEventBadge eventName="Watch Party Wednesdays" />)

      expect(screen.getByTestId('live-badge').parentElement).not.toBe(screen.getByTestId('tooltip'))
    })
  })
})

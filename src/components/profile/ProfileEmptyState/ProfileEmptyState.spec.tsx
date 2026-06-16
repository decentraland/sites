import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileEmptyState } from './ProfileEmptyState'

jest.mock('./ProfileEmptyState.styled', () => {
  const r = jest.requireActual<typeof mockReact>('react')
  return {
    EmptyStateBox: ({ children }: { children?: React.ReactNode }) => r.createElement('div', null, children),
    EmptyStateIcon: ({ children }: { children?: React.ReactNode }) => r.createElement('div', { 'data-testid': 'icon-box' }, children),
    EmptyStateBody: ({ children }: { children?: React.ReactNode }) => r.createElement('div', null, children),
    EmptyStateTitle: ({ children }: { children?: React.ReactNode }) => r.createElement('h6', null, children),
    EmptyStateSubtitle: ({ children }: { children?: React.ReactNode }) => r.createElement('p', null, children),
    EmptyStateButton: ({
      children,
      startIcon,
      endIcon,
      href,
      target,
      rel,
      onClick
    }: {
      children?: React.ReactNode
      startIcon?: React.ReactNode
      endIcon?: React.ReactNode
      href?: string
      target?: string
      rel?: string
      onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
    }) => r.createElement(href ? 'a' : 'button', { href, target, rel, onClick, 'data-testid': 'cta' }, startIcon, children, endIcon)
  }
})

describe('ProfileEmptyState', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the icon, title and subtitle', () => {
    render(<ProfileEmptyState icon={<span data-testid="glyph" />} title="No assets yet" subtitle="Go to marketplace" />)

    expect(screen.getByTestId('glyph')).toBeInTheDocument()
    expect(screen.getByText('No assets yet')).toBeInTheDocument()
    expect(screen.getByText('Go to marketplace')).toBeInTheDocument()
  })

  it('should omit the subtitle and the CTA when neither is provided', () => {
    render(<ProfileEmptyState icon={<span />} title="No assets yet" />)

    expect(screen.queryByTestId('cta')).toBeNull()
  })

  it('should render an external link CTA that opens in a new tab', () => {
    render(
      <ProfileEmptyState icon={<span />} title="No assets yet" action={{ label: 'Go to marketplace', href: 'https://market.example' }} />
    )

    const cta = screen.getByTestId('cta')
    expect(cta.tagName).toBe('A')
    expect(cta).toHaveAttribute('href', 'https://market.example')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should invoke the onClick handler for in-app CTAs', async () => {
    const onClick = jest.fn()
    render(<ProfileEmptyState icon={<span />} title="No photos yet" action={{ label: 'Jump in', onClick }} />)

    const cta = screen.getByTestId('cta')
    expect(cta.tagName).toBe('BUTTON')
    await userEvent.click(cta)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should render the action start and end icons', () => {
    render(
      <ProfileEmptyState
        icon={<span />}
        title="No communities yet"
        action={{ label: 'Explore', startIcon: <span data-testid="start" />, endIcon: <span data-testid="end" /> }}
      />
    )

    expect(screen.getByTestId('start')).toBeInTheDocument()
    expect(screen.getByTestId('end')).toBeInTheDocument()
  })
})

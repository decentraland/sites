import { render } from '@testing-library/react'

const FAKE_THEME = {
  palette: { common: { white: '#fff' } },
  typography: { caption: { fontSize: '0.75rem' } },
  spacing: (...args: number[]) => args.map(a => `${a * 8}px`).join(' ')
}

jest.mock('decentraland-ui2', () => ({
  Box: 'div',
  styled: (_tag: unknown, options?: { shouldForwardProp?: (prop: string) => boolean }) => (styleFactory: unknown) => {
    const shouldForward = options?.shouldForwardProp ?? (() => true)
    const Component = ({ children, ...props }: Record<string, unknown>) => {
      const resolvedStyles =
        typeof styleFactory === 'function'
          ? (styleFactory as (args: unknown) => Record<string, unknown>)({ theme: FAKE_THEME, ...props })
          : styleFactory
      const domProps: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(props)) {
        if (!shouldForward(key)) continue
        domProps[key] = value
      }
      return (
        <div
          {...domProps}
          style={{ ...((domProps.style as Record<string, unknown>) ?? {}), ...(resolvedStyles as Record<string, unknown>) }}
        >
          {children as React.ReactNode}
        </div>
      )
    }
    return Component
  }
}))

const { CardFrame, ChipOverlay, DateChip, StatusChip } =
  jest.requireActual<typeof import('./PendingEventCard.styled')>('./PendingEventCard.styled')

describe('when rendering CardFrame with faded=true', () => {
  it('should apply opacity 0.5 to the DOM element', () => {
    const { container } = render(
      <CardFrame faded>
        <span />
      </CardFrame>
    )
    expect(container.firstChild).toHaveStyle({ opacity: '0.5' })
  })

  it('should not forward the faded prop to the DOM element', () => {
    const { container } = render(
      <CardFrame faded>
        <span />
      </CardFrame>
    )
    expect(container.firstChild).not.toHaveAttribute('faded')
  })
})

describe('when rendering CardFrame without faded', () => {
  it('should apply opacity 1 to the DOM element', () => {
    const { container } = render(
      <CardFrame>
        <span />
      </CardFrame>
    )
    expect(container.firstChild).toHaveStyle({ opacity: '1' })
  })
})

describe('when rendering the chip overlays', () => {
  it('should render ChipOverlay and DateChip without crashing', () => {
    render(
      <ChipOverlay>
        <DateChip>Sat 10</DateChip>
      </ChipOverlay>
    )
  })

  it.each(['pending', 'approved', 'rejected'] as const)('should render StatusChip with status=%s', status => {
    const { container } = render(<StatusChip status={status}>{status}</StatusChip>)
    expect(container.firstChild).not.toHaveAttribute('status')
  })
})

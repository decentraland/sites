import { render } from '@testing-library/react'

jest.mock('decentraland-ui2', () => ({
  Box: 'div',
  styled: (_tag: unknown, options?: { shouldForwardProp?: (prop: string) => boolean }) => (styleFactory: unknown) => {
    const shouldForward = options?.shouldForwardProp ?? (() => true)
    const Component = ({ children, ...props }: Record<string, unknown>) => {
      const resolvedStyles =
        typeof styleFactory === 'function' ? (styleFactory as (args: unknown) => Record<string, unknown>)(props) : styleFactory
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

const { CardFrame } = jest.requireActual<typeof import('./PendingEventCard.styled')>('./PendingEventCard.styled')

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

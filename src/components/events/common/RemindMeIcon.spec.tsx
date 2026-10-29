import { render } from '@testing-library/react'
import { RemindMeIcon } from './RemindMeIcon'

jest.mock('decentraland-ui2', () => ({
  styled: (tag: string) => {
    const fn = (styles: Record<string, unknown>) => {
      const Component = ({ className, children, ...props }: Record<string, unknown>) => {
        const Tag = tag as unknown as React.ElementType
        return (
          <Tag className={className} data-styles={JSON.stringify(styles)} {...props}>
            {children as React.ReactNode}
          </Tag>
        )
      }
      Component.displayName = `styled(${tag})`
      return Component
    }
    return fn
  }
}))

describe('RemindMeIcon', () => {
  describe('when active is false', () => {
    it('should render the outline bell layer as visible', () => {
      const { container } = render(<RemindMeIcon active={false} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs[0]).toHaveStyle({ opacity: 1 })
    })

    it('should render the active bell layer as hidden', () => {
      const { container } = render(<RemindMeIcon active={false} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs[1]).toHaveStyle({ opacity: 0 })
    })

    it('should render the check path with hidden class', () => {
      const { container } = render(<RemindMeIcon active={false} />)

      const checkPath = container.querySelector('svg:last-child path:last-child')
      expect(checkPath).toHaveClass('hidden')
    })
  })

  describe('when active is true', () => {
    it('should render the outline bell layer as hidden', () => {
      const { container } = render(<RemindMeIcon active />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs[0]).toHaveStyle({ opacity: 0 })
    })

    it('should render the active bell layer as visible', () => {
      const { container } = render(<RemindMeIcon active />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs[1]).toHaveStyle({ opacity: 1 })
    })

    it('should render the check path without hidden class', () => {
      const { container } = render(<RemindMeIcon active />)

      const checkPath = container.querySelector('svg:last-child path:last-child')
      expect(checkPath).not.toHaveClass('hidden')
    })

    it('should render the bell path with red fill', () => {
      const { container } = render(<RemindMeIcon active />)

      const bellPath = container.querySelector('svg:last-child path:first-child')
      expect(bellPath).toHaveAttribute('fill', '#FF2D55')
    })
  })

  describe('when shaking is true', () => {
    it('should add the shake class to the container', () => {
      const { container } = render(<RemindMeIcon active={false} shaking />)

      expect(container.firstChild).toHaveClass('shake')
    })
  })

  describe('when shaking is false', () => {
    it('should not add the shake class to the container', () => {
      const { container } = render(<RemindMeIcon active={false} shaking={false} />)

      expect(container.firstChild).not.toHaveClass('shake')
    })
  })

  describe('when a custom size is provided', () => {
    it('should set the width and height', () => {
      const { container } = render(<RemindMeIcon active={false} size={24} />)

      expect(container.firstChild).toHaveStyle({ width: '24px', height: '24px' })
    })
  })

  describe('when a className is provided', () => {
    it('should pass the className to the container', () => {
      const { container } = render(<RemindMeIcon active={false} className="custom" />)

      expect(container.firstChild).toHaveClass('custom')
    })
  })
})

import { render } from '@testing-library/react'
import { LiveEventIcon } from './LiveEventIcon'

describe('LiveEventIcon', () => {
  describe('when it is rendered', () => {
    it('should render an svg element', () => {
      const { container } = render(<LiveEventIcon />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    describe('and custom dimensions are provided', () => {
      it('should apply the provided width and height', () => {
        const { container } = render(<LiveEventIcon width={24} height={18} />)
        const svg = container.querySelector('svg')
        expect(svg).toHaveAttribute('width', '24')
        expect(svg).toHaveAttribute('height', '18')
      })
    })
  })
})

import { render } from '@testing-library/react'
import { PlayIcon } from './PlayIcon'

describe('PlayIcon', () => {
  describe('when rendered', () => {
    it('should render the play icon svg', () => {
      const { container } = render(<PlayIcon />)

      expect(container.querySelector('svg.play-icon')).toBeInTheDocument()
    })
  })
})

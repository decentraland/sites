import { render } from '@testing-library/react'
import { Chevron } from './Chevron'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

describe('Chevron', () => {
  describe('when rendered', () => {
    it('should render an svg', () => {
      const { container } = render(<Chevron />)

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should render the dark variant', () => {
      const { container } = render(<Chevron dark />)

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })
})

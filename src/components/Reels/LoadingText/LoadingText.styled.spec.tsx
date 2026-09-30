jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

import { render } from '@testing-library/react'
import { LoadingBox } from './LoadingText.styled'

describe('LoadingText styled components', () => {
  it.each(['small', 'medium', 'large', 'full'] as const)('renders LoadingBox with size=%s', size => {
    render(<LoadingBox size={size} type="span" />)
  })

  it.each(['span', 'h1', 'h2', 'h3', 'p'] as const)('renders LoadingBox with type=%s', type => {
    render(<LoadingBox size="medium" type={type} />)
  })
})

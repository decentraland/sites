jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/styledMock'))

import { render } from '@testing-library/react'
import { LoadingState, PageRoot } from './SecurityPage.styled'

describe('SecurityPage styled components', () => {
  it('renders every styled component', () => {
    render(
      <>
        <PageRoot />
        <LoadingState />
      </>
    )
  })
})

jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/styledMock'))

import { render } from '@testing-library/react'
import { JumpPageContainer, JumpPageContent } from './PageContainer.styled'

describe('Jump PageContainer styled components', () => {
  it('renders the container and inner content wrapper', () => {
    render(
      <JumpPageContainer>
        <JumpPageContent>child</JumpPageContent>
      </JumpPageContainer>
    )
  })
})

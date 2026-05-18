jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/styledMock'))

import { render } from '@testing-library/react'
import { ContentBox, InvalidPageContainer, InvalidPageContent, MobileActionsContainer } from './InvalidPage.styled'

describe('InvalidPage styled components', () => {
  it('renders every export', () => {
    render(
      <InvalidPageContainer>
        <InvalidPageContent>
          <ContentBox>content</ContentBox>
        </InvalidPageContent>
        <MobileActionsContainer />
      </InvalidPageContainer>
    )
  })
})

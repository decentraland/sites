jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return { ...actual, Logo: 'span' }
})

import { render } from '@testing-library/react'
import { LogoContainer, LogoImage, LogoText } from './Logo.styled'

describe('Logo styled components', () => {
  it('renders the container, image, and text', () => {
    render(
      <LogoContainer href="#">
        <LogoImage />
        <LogoText src="text.svg" alt="Decentraland" />
      </LogoContainer>
    )
  })
})

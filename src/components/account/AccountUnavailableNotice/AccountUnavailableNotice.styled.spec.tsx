jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return { ...actual, Typography: actual.Box }
})

import { render } from '@testing-library/react'
import { Container, Description, TextWrapper, Title } from './AccountUnavailableNotice.styled'

describe('AccountUnavailableNotice styled components', () => {
  it('renders every styled component', () => {
    render(
      <>
        <Container />
        <TextWrapper />
        <Title />
        <Description />
      </>
    )
  })
})

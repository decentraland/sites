jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../../__test-utils__/styledMock')
  return { ...actual, Typography: actual.Box }
})

import { render } from '@testing-library/react'
import {
  Container,
  Intro,
  ResponsibilityDescription,
  ResponsibilityTitle,
  RevealActions,
  RevealDescription,
  SectionTitle,
  TitleRow,
  WarningBox,
  WarningDescription,
  WarningTextWrapper,
  WarningTitle
} from './SecuritySection.styled'

describe('SecuritySection styled components', () => {
  it('renders every styled component', () => {
    render(
      <>
        <Container />
        <TitleRow />
        <SectionTitle />
        <Intro />
        <ResponsibilityTitle />
        <ResponsibilityDescription />
        <WarningBox />
        <WarningTextWrapper />
        <WarningTitle />
        <WarningDescription />
        <RevealDescription />
        <RevealActions />
      </>
    )
  })
})

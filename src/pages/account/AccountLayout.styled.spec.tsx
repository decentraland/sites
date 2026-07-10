jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../__test-utils__/styledMock')
  return { ...actual, Typography: actual.Box }
})

import { render } from '@testing-library/react'
import {
  AccountContent,
  AccountLayoutRoot,
  AccountPageContainer,
  MobileBackButton,
  MobileCloseButton,
  MobileSection,
  MobileSectionHeader,
  SignInPrompt,
  SignInTitle
} from './AccountLayout.styled'

describe('AccountLayout styled components', () => {
  it('renders every styled component', () => {
    render(
      <>
        <AccountLayoutRoot />
        <AccountPageContainer />
        <AccountContent />
        <MobileSection />
        <MobileSectionHeader />
        <MobileBackButton />
        <MobileCloseButton />
        <SignInPrompt />
        <SignInTitle />
      </>
    )
  })
})

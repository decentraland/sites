jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const Typography = ReactLib.forwardRef(
    ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLSpanElement>) =>
      ReactLib.createElement('span', { ref, ...(rest as Record<string, unknown>) }, children)
  )
  return { ...actual, Typography }
})

import { render } from '@testing-library/react'
import {
  ContentWrapper,
  DateLine,
  Divider,
  JumpInButton,
  LogoHeader,
  MetadataContainer,
  PeopleContainer,
  PeopleTitle,
  PlaceLeftSide,
  PlaceLine,
  PlaceLink,
  PlaceText,
  SectionTitle,
  UserAvatar,
  UserLine,
  UserNameLink
} from './Metadata.styled'

describe('Metadata styled components', () => {
  it('renders the static-styled containers without throwing', () => {
    render(
      <MetadataContainer>
        <LogoHeader />
        <ContentWrapper>
          <SectionTitle>Date</SectionTitle>
          <DateLine>Today</DateLine>
          <PeopleTitle>People</PeopleTitle>
          <UserLine>
            <UserAvatar src="a.png" alt="a" />
            <UserNameLink href="#">Name</UserNameLink>
          </UserLine>
          <PlaceLine>
            <PlaceLeftSide>
              <PlaceLink href="#">Place</PlaceLink>
              <PlaceText>10, 20</PlaceText>
            </PlaceLeftSide>
            <JumpInButton href="#">Jump in</JumpInButton>
          </PlaceLine>
          <Divider />
          <PeopleContainer>People</PeopleContainer>
        </ContentWrapper>
      </MetadataContainer>
    )
  })
})

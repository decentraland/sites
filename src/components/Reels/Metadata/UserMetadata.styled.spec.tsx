jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const Typography = ReactLib.forwardRef(
    ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLSpanElement>) =>
      ReactLib.createElement('span', { ref, ...(rest as Record<string, unknown>) }, children)
  )
  const Chip = ReactLib.forwardRef(
    ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLSpanElement>) =>
      ReactLib.createElement('span', { ref, ...(rest as Record<string, unknown>) }, children)
  )
  return { ...actual, Typography, Chip }
})

import { render } from '@testing-library/react'
import {
  ChevronButton,
  GuestBadge,
  NoWearablesBox,
  NoWearablesText,
  UserAvatar,
  UserAvatarFallback,
  UserMetadataContainer,
  UserMetadataRow,
  UserMetadataWrapper,
  UserName,
  UserNameStatic,
  WearablesPanel,
  WearablesTitle
} from './UserMetadata.styled'

describe('UserMetadata styled components', () => {
  it('renders every export with both prop variants', () => {
    render(
      <>
        <UserMetadataContainer isFirst>
          <UserMetadataRow>
            <UserMetadataWrapper>
              <UserAvatar src="a.png" alt="a" />
              <UserAvatarFallback />
              <UserName href="#">Alice</UserName>
              <UserNameStatic>Bob</UserNameStatic>
              <GuestBadge label="Guest" />
            </UserMetadataWrapper>
            <ChevronButton />
          </UserMetadataRow>
          <WearablesPanel visible>
            <WearablesTitle>Wearables</WearablesTitle>
            <NoWearablesBox>
              <NoWearablesText>None</NoWearablesText>
            </NoWearablesBox>
          </WearablesPanel>
          <WearablesPanel visible={false} />
        </UserMetadataContainer>
        <UserMetadataContainer isFirst={false} />
      </>
    )
  })
})

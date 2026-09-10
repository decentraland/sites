jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const passthrough = (tag: string) =>
    ReactLib.forwardRef(({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
      ReactLib.createElement(tag, { ref, ...(rest as Record<string, unknown>) }, children)
    )
  return { ...actual, Typography: passthrough('span') }
})

import { render } from '@testing-library/react'
import {
  AdminActionsRow,
  BottomJumpInRow,
  CreatorLocationRow,
  EditButton,
  FeaturedItemText,
  LiveBadgeWrapper,
  LocationRow,
  LocationText,
  RecurrenceText,
  ScheduleIconButton,
  ScheduleRow,
  ScheduleSubtitle,
  ScheduleText
} from './EventDetailModal.styled'

describe('EventDetailModal styled components', () => {
  it('renders every styled component so the style callbacks execute', () => {
    render(
      <>
        <ScheduleSubtitle>subtitle</ScheduleSubtitle>
        <FeaturedItemText>urn:decentraland:matic:collections-v2:0x0</FeaturedItemText>
        <LiveBadgeWrapper>badge</LiveBadgeWrapper>
        <CreatorLocationRow>creator</CreatorLocationRow>
        <LocationRow disabled>
          <LocationText>coords</LocationText>
        </LocationRow>
        <LocationRow>
          <LocationText>coords</LocationText>
        </LocationRow>
        <EditButton>edit</EditButton>
        <ScheduleRow>
          <ScheduleText>schedule</ScheduleText>
          <ScheduleIconButton>icon</ScheduleIconButton>
        </ScheduleRow>
        <RecurrenceText>recurrence</RecurrenceText>
        <AdminActionsRow>admin</AdminActionsRow>
        <BottomJumpInRow>jump</BottomJumpInRow>
      </>
    )
  })
})

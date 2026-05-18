jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@mui/icons-material/X', () => ({
  __esModule: true,
  default: 'svg'
}))

import { render } from '@testing-library/react'
import {
  ActionIcon,
  ActionsContainer,
  CopyLinkBadge,
  CopyLinkWrapper,
  InfoButton,
  InfoIcon,
  ShareButton,
  ShareIcon,
  Spacer
} from './ImageActions.styled'

describe('ImageActions styled components', () => {
  it('renders the static and dynamic-styled components without throwing', () => {
    render(
      <>
        <ActionsContainer />
        <ActionIcon src="x.png" alt="x" />
        <ShareButton type="button">Share</ShareButton>
        <ShareIcon />
        <Spacer />
        <CopyLinkWrapper>
          <CopyLinkBadge visible>Copied!</CopyLinkBadge>
          <CopyLinkBadge visible={false}>Copied!</CopyLinkBadge>
        </CopyLinkWrapper>
        <InfoButton metadataVisible>
          <InfoIcon src="info.svg" alt="info" />
        </InfoButton>
        <InfoButton metadataVisible={false}>
          <InfoIcon src="info.svg" alt="info" />
        </InfoButton>
      </>
    )
  })
})

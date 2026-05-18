jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

import { render } from '@testing-library/react'
import { Gradient, ImageWrapper, InlineLogo, LoaderOverlay, ViewerContainer } from './ImageViewer.styled'

describe('ImageViewer styled components', () => {
  it('renders the static and dynamic-styled wrappers with both metadataVisible variants', () => {
    render(
      <>
        <ViewerContainer metadataVisible>
          <ImageWrapper>
            <img src="x.png" alt="x" />
          </ImageWrapper>
          <Gradient />
          <LoaderOverlay>loading</LoaderOverlay>
          <InlineLogo>logo</InlineLogo>
        </ViewerContainer>
        <ViewerContainer metadataVisible={false} />
      </>
    )
  })
})

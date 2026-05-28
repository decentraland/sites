jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))

import { render, screen } from '@testing-library/react'
import { ErrorIcon, ErrorRow, ErrorText, OverlayText, PreviewImage, PreviewOverlay, errorPulse, errorShake } from './shared.styled'

describe('CreateEvent shared.styled', () => {
  it('exposes the keyframe templates', () => {
    expect(errorPulse).toBeDefined()
    expect(errorShake).toBeDefined()
  })

  it('renders the error row, icon, and text wrappers with the provided message', () => {
    render(
      <ErrorRow>
        <ErrorIcon>icon</ErrorIcon>
        <ErrorText>oops</ErrorText>
      </ErrorRow>
    )

    expect(screen.getByText('icon')).toBeInTheDocument()
    expect(screen.getByText('oops')).toBeInTheDocument()
  })

  it('renders the preview overlay with the overlay text and the preview image', () => {
    render(
      <PreviewOverlay>
        <OverlayText>Change</OverlayText>
        <PreviewImage src="https://example.com/x.webp" alt="preview" />
      </PreviewOverlay>
    )

    expect(screen.getByText('Change')).toBeInTheDocument()
    expect(screen.getByAltText('preview')).toHaveAttribute('src', 'https://example.com/x.webp')
  })
})

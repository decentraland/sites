import { render, screen } from '@testing-library/react'
import { DownloadTarget, SectionViewedTrack } from '../../modules/segment'
import { CTAButton } from './CTAButton'

// CTAButton itself doesn't call useTrackClick (callers wire onClick/trackClick
// themselves — see Hero.tsx / CreatorHubDownload.tsx), so no analytics hook
// needs mocking here. This spec only covers the component's own rendering,
// in particular the `data-download-target` passthrough added alongside the
// `downloadTarget` prop.

// decentraland-ui2's dist is ESM-only and isn't transformed by ts-jest, so — as
// in every other spec that touches it (e.g. DownloadOptions.spec.tsx) — the
// package and this component's own `.styled.ts` file are replaced with thin
// DOM passthroughs. CTAButton.tsx itself stays real and untouched.
jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => null
}))

jest.mock('./CTAButton.styled', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CTAButtonStyled: ({ children, variant, fullWidth, startIcon, endIcon, disabled, ...rest }: any) =>
      ReactLib.createElement('a', rest, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CTAButtonLabelContainer: ({ children }: any) => ReactLib.createElement('div', null, children)
  }
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('CTAButton', () => {
  describe('when a downloadTarget is provided', () => {
    it('should render the data-download-target attribute with the given value', () => {
      render(
        <CTAButton
          href="https://cdn.example.com/mac.dmg"
          onClick={jest.fn()}
          label="Download"
          place={SectionViewedTrack.DOWNLOAD}
          downloadTarget={DownloadTarget.CREATOR_HUB}
        />
      )

      expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('data-download-target', 'creator_hub')
    })
  })

  describe('when no downloadTarget is provided', () => {
    it('should not render the data-download-target attribute', () => {
      render(<CTAButton href="https://cdn.example.com/mac.dmg" onClick={jest.fn()} label="Download" place={SectionViewedTrack.DOWNLOAD} />)

      expect(screen.getByRole('link', { name: 'Download' })).not.toHaveAttribute('data-download-target')
    })
  })
})

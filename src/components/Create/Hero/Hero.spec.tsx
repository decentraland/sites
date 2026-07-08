import { fireEvent, render, screen } from '@testing-library/react'
import { useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useCreatorHubDownload } from '../../../hooks/useCreatorHubDownload'
import { CreatorsHero } from './Hero'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return {
    styled,
    Box,
    Typography,
    useDesktopMediaQuery: jest.fn(),
    useMediaQuery: jest.fn()
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

jest.mock('../../../hooks/useCreatorHubDownload', () => ({
  useCreatorHubDownload: jest.fn()
}))

// The typing effect's own timing is covered by useTypingListEffect.spec.ts —
// mock it here so this spec only asserts Hero's wiring (data-* attributes,
// which CTA calls handleDownload/trackClick).
jest.mock('../../../hooks/useTypingListEffect', () => ({
  useTypingListEffect: () => 'build'
}))

jest.mock('../../Video', () => ({
  Video: () => <div data-testid="video" />
}))

// The shared styledMock's shouldForwardProp allowlist doesn't cover Chevron's
// custom `dark` prop, which would otherwise leak onto the raw <svg> as a
// non-boolean-attribute React warning. Out of scope for this spec (which only
// asserts Hero's download-target wiring), so stub it out.
jest.mock('./Chevron', () => ({
  Chevron: () => <svg data-testid="chevron" />
}))

// CTAButton's own rendering (MUI Button/CircularProgress) is out of scope here —
// this spec only asserts which data-* attributes/props Hero wires into it. Mocking
// it as a plain anchor also avoids MUI-only prop names (fullWidth/startIcon/endIcon)
// leaking onto the styledMock's passthrough DOM node as unknown-attribute noise.
jest.mock('../../Buttons/CTAButton', () => ({
  CTAButton: ({
    href,
    onClick,
    label,
    place,
    event,
    downloadTarget
  }: {
    href: string
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
    label: React.ReactNode
    place: string
    event?: string
    downloadTarget?: string
  }) => (
    <a href={href} data-place={place} data-event={event} data-download-target={downloadTarget} onClick={onClick as never}>
      {label}
    </a>
  )
}))

const mockDesktopMediaQuery = jest.mocked(useDesktopMediaQuery)
const mockMediaQuery = jest.mocked(useMediaQuery)
const mockTrackClick = jest.mocked(useTrackClick)
const mockCreatorHubDownload = jest.mocked(useCreatorHubDownload)

const trackClick = jest.fn()
const handleDownload = jest.fn()

describe('CreatorsHero', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
    mockMediaQuery.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the download options are ready on desktop', () => {
    beforeEach(() => {
      mockDesktopMediaQuery.mockReturnValue(true)
      mockCreatorHubDownload.mockReturnValue({
        isReady: true,
        primaryOption: { text: 'macOS', image: 'mac.png', link: 'https://cdn.example.com/mac.dmg' },
        secondaryOptions: [{ text: 'Windows', image: 'win.png', link: 'https://cdn.example.com/win.exe' }],
        handleDownload
      } as unknown as ReturnType<typeof useCreatorHubDownload>)
    })

    it('should tag the secondary platform icon with the creator_hub download target', () => {
      render(<CreatorsHero />)

      const secondaryButton = screen.getByAltText('Windows').closest('button') as HTMLButtonElement
      expect(secondaryButton).toHaveAttribute('data-download-target', 'creator_hub')

      fireEvent.click(secondaryButton)

      expect(trackClick).toHaveBeenCalledTimes(1)
      expect(handleDownload).toHaveBeenCalledWith(expect.objectContaining({ text: 'Windows' }))
    })

    it('should tag the primary Creator Hub download CTA with the creator_hub download target', () => {
      render(<CreatorsHero />)

      const primaryCta = screen.getByRole('link', { name: 'page.download.download_creator_hub' })
      expect(primaryCta).toHaveAttribute('data-download-target', 'creator_hub')
      expect(primaryCta).toHaveAttribute('href', 'https://cdn.example.com/mac.dmg')
    })
  })

  describe('when the download options are not ready yet', () => {
    beforeEach(() => {
      mockDesktopMediaQuery.mockReturnValue(true)
      mockCreatorHubDownload.mockReturnValue({
        isReady: false,
        primaryOption: null,
        secondaryOptions: [],
        handleDownload
      } as unknown as ReturnType<typeof useCreatorHubDownload>)
    })

    it('should tag the fallback Creator Hub download CTA with the creator_hub download target', () => {
      const { container } = render(<CreatorsHero />)

      const fallbackCta = container.querySelector('[data-download-target="creator_hub"]') as HTMLElement
      expect(fallbackCta).toBeInTheDocument()
      expect(fallbackCta).toHaveAttribute('href', '/download/creator-hub')

      fireEvent.click(fallbackCta)

      expect(trackClick).toHaveBeenCalledTimes(1)
    })
  })
})

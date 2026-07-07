import { fireEvent, render, screen } from '@testing-library/react'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useCreatorHubDownload } from '../../hooks/useCreatorHubDownload'
import { CreatorHubDownload } from './CreatorHubDownload'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <h3 {...rest}>{children}</h3>
  return {
    styled,
    Box,
    Typography,
    Logo: () => <div data-testid="logo" />
  }
})

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

jest.mock('../../hooks/useCreatorHubDownload', () => ({
  useCreatorHubDownload: jest.fn()
}))

// CTAButton's own rendering (MUI Button/CircularProgress) is out of scope here —
// this spec only asserts the AlternativeIconButton's data-* wiring. Mocking it
// as a plain anchor also avoids MUI-only prop names (fullWidth/startIcon/endIcon)
// leaking onto the styledMock's passthrough DOM node as unknown-attribute noise.
jest.mock('../../components/Buttons/CTAButton', () => ({
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

const mockTrackClick = jest.mocked(useTrackClick)
const mockCreatorHubDownload = jest.mocked(useCreatorHubDownload)

const trackClick = jest.fn()
const handleDownload = jest.fn()

describe('CreatorHubDownload', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
    mockCreatorHubDownload.mockReturnValue({
      isReady: true,
      primaryOption: { text: 'macOS', image: 'mac.png', link: 'https://cdn.example.com/mac.dmg' },
      secondaryOptions: [{ text: 'Windows', image: 'win.png', link: 'https://cdn.example.com/win.exe' }],
      handleDownload
    } as unknown as ReturnType<typeof useCreatorHubDownload>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should tag the secondary platform icon with the creator_hub download target', () => {
    render(<CreatorHubDownload />)

    const secondaryButton = screen.getByAltText('Windows').closest('button') as HTMLButtonElement
    expect(secondaryButton).toHaveAttribute('data-download-target', 'creator_hub')

    fireEvent.click(secondaryButton)

    expect(trackClick).toHaveBeenCalledTimes(1)
    expect(handleDownload).toHaveBeenCalledWith(expect.objectContaining({ text: 'Windows' }))
  })

  describe('when not ready', () => {
    beforeEach(() => {
      mockCreatorHubDownload.mockReturnValue({
        isReady: false,
        primaryOption: null,
        secondaryOptions: [],
        handleDownload
      } as unknown as ReturnType<typeof useCreatorHubDownload>)
    })

    it('should render nothing', () => {
      const { container } = render(<CreatorHubDownload />)
      expect(container).toBeEmptyDOMElement()
    })
  })
})

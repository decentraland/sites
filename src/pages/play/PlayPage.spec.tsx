import { fireEvent, render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useAnonUserId } from '../../hooks/useAnonUserId'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import { PlayPage } from '.'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return {
    styled,
    Box,
    Typography,
    dclColors: { neutral: { white: '#FCFCFC' } },
    AnimatedBackground: (props: Record<string, unknown>) => <div data-testid="animated-background" data-variant={String(props.variant)} />,
    DownloadModal: ({ open }: { open: boolean }) => (open ? <div data-testid="download-modal" /> : null)
  }
})

jest.mock('../../components/Icon/VerifiedIcon', () => ({
  VerifiedIcon: () => <span data-testid="verified-icon" />
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn()
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

jest.mock('../../hooks/useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anon_user_id',
  useAnonUserId: jest.fn()
}))

jest.mock('../../hooks/useHangOutAction', () => ({
  useHangOutAction: jest.fn()
}))

const mockUserAgent = jest.mocked(useAdvancedUserAgentData)
const mockTrackClick = jest.mocked(useTrackClick)
const mockAnonUserId = jest.mocked(useAnonUserId)
const mockHangOut = jest.mocked(useHangOutAction)

const trackClick = jest.fn()
const handleJumpIn = jest.fn()
const closeDownloadModal = jest.fn()

const originalLocation = window.location

const setLocationMock = () => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: '' }
  })
}

describe('PlayPage', () => {
  beforeEach(() => {
    mockTrackClick.mockReturnValue(trackClick)
    mockAnonUserId.mockReturnValue('anon-123')
    mockHangOut.mockReturnValue({
      handleClick: handleJumpIn,
      isDownloadModalOpen: false,
      closeDownloadModal,
      downloadModalProps: { os: 'windows' },
      totalDownloads: '+250K'
    } as unknown as ReturnType<typeof useHangOutAction>)
    mockUserAgent.mockReturnValue([false, { os: { name: 'Windows' }, mobile: false }] as unknown as ReturnType<
      typeof useAdvancedUserAgentData
    >)
    setLocationMock()
  })

  afterEach(() => {
    jest.resetAllMocks()
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
  })

  describe('when it renders on a Windows desktop', () => {
    it('should show the deprecation message, CTAs and store badges', () => {
      render(<PlayPage />)
      expect(screen.getByText('page.play.title')).toBeInTheDocument()
      expect(screen.getByText('page.play.subtitle')).toBeInTheDocument()
      expect(screen.getByText('page.download.download_for_short')).toBeInTheDocument()
      expect(screen.getByText('page.download.download_on')).toBeInTheDocument()
      expect(screen.getByText('page.play.also_available_on')).toBeInTheDocument()
      expect(screen.getByText('page.play.jump_in')).toBeInTheDocument()
      expect(screen.getByAltText('Download on the App Store')).toBeInTheDocument()
      expect(screen.getByAltText('Get it on Google Play')).toBeInTheDocument()
      expect(screen.getByTestId('animated-background')).toHaveAttribute('data-variant', 'absolute')
    })

    it('should track and navigate to /download_success with the os and anon id on download click', () => {
      render(<PlayPage />)
      fireEvent.click(screen.getByText('page.download.download_for_short'))
      expect(trackClick).toHaveBeenCalledTimes(1)
      expect(window.location.href).toContain('/download_success?')
      expect(window.location.href).toContain('os=Windows')
      expect(window.location.href).toContain('place=play-hero')
      expect(window.location.href).toContain('anon_user_id=anon-123')
    })

    it('should track the jump-in click and trigger the hang out action', () => {
      render(<PlayPage />)
      fireEvent.click(screen.getByText('page.play.jump_in'))
      expect(trackClick).toHaveBeenCalledTimes(1)
      expect(handleJumpIn).toHaveBeenCalledTimes(1)
    })
  })

  describe('when there is no resolved user agent', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, undefined] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    })

    it('should fall back to the static /download href and not navigate on click', () => {
      render(<PlayPage />)
      const cta = screen.getByText('page.download.download_for_short').closest('a')
      expect(cta).toHaveAttribute('href', '/download')
      fireEvent.click(cta as HTMLElement)
      expect(trackClick).toHaveBeenCalledTimes(1)
      expect(window.location.href).toBe('')
    })
  })

  describe('when the anon user id is unavailable', () => {
    beforeEach(() => {
      mockAnonUserId.mockReturnValue(undefined)
    })

    it('should omit the anon_user_id query param', () => {
      render(<PlayPage />)
      fireEvent.click(screen.getByText('page.download.download_for_short'))
      expect(window.location.href).toContain('os=Windows')
      expect(window.location.href).not.toContain('anon_user_id')
    })
  })

  describe('when the download modal is open', () => {
    beforeEach(() => {
      mockHangOut.mockReturnValue({
        handleClick: handleJumpIn,
        isDownloadModalOpen: true,
        closeDownloadModal,
        downloadModalProps: { os: 'apple' },
        totalDownloads: '+250K'
      } as unknown as ReturnType<typeof useHangOutAction>)
      mockUserAgent.mockReturnValue([false, { os: { name: 'macOS' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should render the download modal', () => {
      render(<PlayPage />)
      expect(screen.getByTestId('download-modal')).toBeInTheDocument()
    })
  })
})

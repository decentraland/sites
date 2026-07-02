import { fireEvent, render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useAnonUserId } from '../../hooks/useAnonUserId'
import { useHangOutAction } from '../../hooks/useHangOutAction'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { SegmentEvent } from '../../modules/segment'
import { PlayPage } from '.'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return {
    styled,
    Box,
    Typography,
    dclColors: {
      neutral: { white: '#FFFFFF', trueWhite: '#FFFFFF', softWhite: '#FCFCFC', softBlack2: '#242129' },
      brand: { ruby: '#FF2D55' },
      whiteTransparent: { soft: 'rgba(255, 255, 255, 0.2)', backdrop: 'rgba(255, 255, 255, 0.6)' }
    },
    AnimatedBackground: (props: Record<string, unknown>) => <div data-testid="animated-background" data-variant={String(props.variant)} />,
    useDesktopMediaQuery: jest.fn()
  }
})

jest.mock('../../components/Icon/VerifiedIcon', () => ({
  VerifiedIcon: () => <span data-testid="verified-icon" />
}))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn(),
  useAnalytics: jest.fn()
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage:
    () =>
    (id: string, values?: Record<string, React.ReactNode>): React.ReactNode =>
      values ? (
        <>
          {id}
          {Object.entries(values).map(([key, value]) => (
            <span key={key}>{value}</span>
          ))}
        </>
      ) : (
        id
      )
}))

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://decentraland.zone'
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

jest.mock('../../modules/url', () => ({
  buildDownloadSuccessHref: (os: string, place: string, options?: { anonUserId?: string }) =>
    `/download_success?os=${os}&place=${place}${options?.anonUserId ? `&anon_user_id=${options.anonUserId}` : ''}`
}))

const mockUserAgent = jest.mocked(useAdvancedUserAgentData)
const mockUseAnalytics = jest.mocked(useAnalytics)
const mockTrackClick = jest.mocked(useTrackClick)
const mockAnonUserId = jest.mocked(useAnonUserId)
const mockHangOut = jest.mocked(useHangOutAction)
const mockDesktop = jest.mocked(useDesktopMediaQuery)

const trackClick = jest.fn()
let analyticsTrack: jest.Mock
let mockSendBeacon: jest.Mock

const originalLocation = window.location
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalSendBeacon = navigator.sendBeacon

const setLocationMock = () => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: '' }
  })
}

describe('PlayPage', () => {
  beforeEach(() => {
    analyticsTrack = jest.fn()
    mockSendBeacon = jest.fn(() => true)
    mockUseAnalytics.mockReturnValue({ isInitialized: true, track: analyticsTrack } as unknown as ReturnType<typeof useAnalytics>)
    mockTrackClick.mockReturnValue(trackClick)
    mockDesktop.mockReturnValue(true)
    mockAnonUserId.mockReturnValue('anon-123')
    mockHangOut.mockReturnValue({ totalDownloads: '+250K' } as unknown as ReturnType<typeof useHangOutAction>)
    mockUserAgent.mockReturnValue([false, { os: { name: 'Windows' }, mobile: false }] as unknown as ReturnType<
      typeof useAdvancedUserAgentData
    >)
    setLocationMock()
    Object.defineProperty(navigator, 'sendBeacon', { value: mockSendBeacon, configurable: true, writable: true })
  })

  afterEach(() => {
    jest.resetAllMocks()
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
    Object.defineProperty(navigator, 'sendBeacon', { value: originalSendBeacon, configurable: true, writable: true })
    localStorage.clear()
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
      expect(screen.getByAltText('Windows')).toBeInTheDocument()
      expect(screen.getByTestId('animated-background')).toHaveAttribute('data-variant', 'absolute')
    })

    it('should show the Apple icon on the download CTA for a macOS user', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'macOS' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      expect(screen.getByAltText('macOS')).toBeInTheDocument()
      expect(screen.queryByAltText('Windows')).not.toBeInTheDocument()
    })

    it('should track and navigate to /download_success with the os and anon id on download click', () => {
      render(<PlayPage />)
      fireEvent.click(screen.getByText('page.download.download_for_short'))
      expect(analyticsTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ event: SegmentEvent.DOWNLOAD, place: 'play-hero' })
      )
      expect(window.location.href).toContain('/download_success?')
      expect(window.location.href).toContain('os=Windows')
      expect(window.location.href).toContain('place=play-hero')
      expect(window.location.href).toContain('anon_user_id=anon-123')
    })

    it('should beacon the download Click when Segment is cold', () => {
      mockUseAnalytics.mockReturnValue({ isInitialized: false, track: analyticsTrack } as unknown as ReturnType<typeof useAnalytics>)

      render(<PlayPage />)
      fireEvent.click(screen.getByText('page.download.download_for_short'))

      expect(mockSendBeacon).toHaveBeenCalledTimes(1)
    })

    it('should link the jump-in CTA to the launcher protocol and track the click', () => {
      render(<PlayPage />)
      const jumpIn = screen.getByText('page.play.jump_in')
      expect(jumpIn).toHaveAttribute('href', 'decentraland://?')
      fireEvent.click(jumpIn)
      expect(trackClick).toHaveBeenCalledTimes(1)
    })

    it('should link the experimental web CTA to the env bevy-web build', () => {
      render(<PlayPage />)
      expect(screen.getByText('page.play.experimental')).toBeInTheDocument()
      const here = screen.getByText('page.play.here')
      expect(here).toHaveAttribute('href', 'https://decentraland.zone/bevy-web')
      fireEvent.click(here)
      expect(trackClick).toHaveBeenCalledTimes(1)
    })

    it('should link the Epic CTA to the Epic Games store and track the click', () => {
      render(<PlayPage />)
      const epic = screen.getByText('page.download.download_on')
      expect(epic).toHaveAttribute('href', DOWNLOAD_URLS.epic)
      expect(screen.getByAltText('Epic Games')).toBeInTheDocument()
      fireEvent.click(epic)
      expect(analyticsTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ event: SegmentEvent.DOWNLOAD, place: 'play-hero-epic' })
      )
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
      expect(analyticsTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ event: SegmentEvent.DOWNLOAD, place: 'play-hero' })
      )
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

  describe('when it renders on a mobile device', () => {
    beforeEach(() => {
      mockDesktop.mockReturnValue(false)
    })

    it('should show the App Store CTA on an iOS device (no desktop CTAs)', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      expect(screen.getByText('page.play.title')).toBeInTheDocument()
      expect(screen.getByAltText('Download on the App Store')).toBeInTheDocument()
      expect(screen.getByText('page.play.jump_in')).toBeInTheDocument()
      expect(screen.queryByText('page.download.download_for_short')).not.toBeInTheDocument()
      expect(screen.queryByText('page.play.also_available_on')).not.toBeInTheDocument()
    })

    it('should show the Google Play CTA on an Android device', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Android' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      expect(screen.getByAltText('Get it on Google Play')).toBeInTheDocument()
      expect(screen.queryByAltText('Download on the App Store')).not.toBeInTheDocument()
    })

    it('should not show the experimental web link on mobile', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      expect(screen.queryByText('page.play.experimental')).not.toBeInTheDocument()
    })

    it('should link the jump-in CTA to the launcher protocol on mobile', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      const jumpIn = screen.getByText('page.play.jump_in')
      expect(jumpIn).toHaveAttribute('href', 'decentraland://?')
      fireEvent.click(jumpIn)
      expect(trackClick).toHaveBeenCalledTimes(1)
    })
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { useDownloadSuccessHref } from '../../hooks/useDownloadSuccessHref'
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

jest.mock('../../hooks/useHangOutAction', () => ({
  useHangOutAction: jest.fn()
}))

// The hook's own UTM-forwarding / anon_user_id behavior is covered by
// useDownloadSuccessHref.spec.ts — mock it here as a plain (os, place) => href
// builder so this spec only asserts PlayPage's wiring (which CTAs call it,
// what data-* attributes they carry).
jest.mock('../../hooks/useDownloadSuccessHref', () => ({ useDownloadSuccessHref: jest.fn() }))

const mockUserAgent = jest.mocked(useAdvancedUserAgentData)
const mockUseAnalytics = jest.mocked(useAnalytics)
const mockTrackClick = jest.mocked(useTrackClick)
const mockDownloadSuccessHref = jest.mocked(useDownloadSuccessHref)
const mockHangOut = jest.mocked(useHangOutAction)
const mockDesktop = jest.mocked(useDesktopMediaQuery)

const trackClick = jest.fn()
const downloadSuccessHref = jest.fn()
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
    // Re-armed every test: jest.resetAllMocks() in afterEach wipes the
    // implementation, not just the return value.
    downloadSuccessHref.mockImplementation((os: string, place: string) => `/download_success?os=${os}&place=${place}`)
    mockDownloadSuccessHref.mockReturnValue(downloadSuccessHref)
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

    it('should track and navigate to the href built by the shared useDownloadSuccessHref hook', () => {
      // UTM/anon_user_id forwarding is a useDownloadSuccessHref concern, covered
      // in useDownloadSuccessHref.spec.ts — this asserts PlayPage wires
      // os/place through to it and navigates to whatever it returns.
      render(<PlayPage />)
      fireEvent.click(screen.getByText('page.download.download_for_short'))
      expect(analyticsTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ event: SegmentEvent.DOWNLOAD, place: 'play-hero' })
      )
      expect(downloadSuccessHref).toHaveBeenCalledWith('Windows', 'play-hero')
      expect(window.location.href).toBe('/download_success?os=Windows&place=play-hero')
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
      // Epic redirects to the Epic Games Store, never reaching download_started —
      // its own target keeps it out of the desktop activation funnel.
      expect(epic).toHaveAttribute('data-download-target', 'epic')
      expect(screen.getByAltText('Epic Games')).toBeInTheDocument()
      fireEvent.click(epic)
      expect(analyticsTrack).toHaveBeenCalledWith(
        SegmentEvent.CLICK,
        expect.objectContaining({ event: SegmentEvent.DOWNLOAD, place: 'play-hero-epic' })
      )
    })

    it('should tag the desktop CTA as desktop_installer, Epic as epic, and store badges with their store targets', () => {
      render(<PlayPage />)
      const downloadButton = screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement
      const epicButton = screen.getByText('page.download.download_on').closest('a') as HTMLAnchorElement
      const appStoreBadge = screen.getByAltText('Download on the App Store').closest('a') as HTMLAnchorElement
      const googlePlayBadgeLink = screen.getByAltText('Get it on Google Play').closest('a') as HTMLAnchorElement

      expect(downloadButton).toHaveAttribute('data-download-target', 'desktop_installer')
      // Epic redirects to the Epic Games Store, never reaching download_started.
      expect(epicButton).toHaveAttribute('data-download-target', 'epic')
      expect(appStoreBadge).toHaveAttribute('data-download-target', 'app_store')
      expect(googlePlayBadgeLink).toHaveAttribute('data-download-target', 'google_play')
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

    it('should preserve campaign params on the /download fallback href', () => {
      // Extend the location stub with a utm-bearing search so the real
      // withCampaignParams (not mocked here) reads it at render time.
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { href: '', search: '?utm_source=shefi' }
      })
      render(<PlayPage />)
      const cta = screen.getByText('page.download.download_for_short').closest('a')
      expect(cta).toHaveAttribute('href', '/download?utm_source=shefi')
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

    it('should tag the mobile App Store CTA as app_store', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      const cta = screen.getByAltText('Download on the App Store').closest('a') as HTMLAnchorElement
      expect(cta).toHaveAttribute('data-download-target', 'app_store')
    })

    it('should show the Google Play CTA on an Android device', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Android' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      expect(screen.getByAltText('Get it on Google Play')).toBeInTheDocument()
      expect(screen.queryByAltText('Download on the App Store')).not.toBeInTheDocument()
    })

    it('should tag the mobile Google Play CTA as google_play', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Android' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
      render(<PlayPage />)
      const cta = screen.getByAltText('Get it on Google Play').closest('a') as HTMLAnchorElement
      expect(cta).toHaveAttribute('data-download-target', 'google_play')
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

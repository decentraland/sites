import { fireEvent, render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { useDownloadClick } from '../../../hooks/useDownloadClick'
import { useDownloadSuccessHref } from '../../../hooks/useDownloadSuccessHref'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { DownloadPlace, SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { Hero } from './Hero'

jest.mock('decentraland-ui2', () => {
  const { styled, Box } = jest.requireActual('../../../__test-utils__/styledMock')
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
    DownloadModal: ({ open }: { open?: boolean }) => <div data-testid="download-modal" data-open={String(!!open)} />,
    DownloadQRModal: ({ open, os }: { open?: boolean; os?: string }) => (
      <div data-testid="download-qr-modal" data-open={String(!!open)} data-os={os} />
    )
  }
})

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn(),
  useAsyncMemo: jest.fn()
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../hooks/useDownloadClick', () => ({
  useDownloadClick: jest.fn()
}))

jest.mock('../../../hooks/useHangOutAction', () => ({
  useHangOutAction: jest.fn()
}))

jest.mock('../../../hooks/useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anon_user_id',
  useAnonUserId: jest.fn(() => undefined)
}))

jest.mock('../../../modules/explorerDownloads', () => ({
  ExplorerDownloads: { get: jest.fn(() => ({ getTotalDownloads: jest.fn().mockResolvedValue(500000) })) }
}))

jest.mock('../../Icon/VerifiedIcon', () => ({
  VerifiedIcon: () => <span data-testid="verified-icon" />
}))

// The hook's own UTM-forwarding / anon_user_id behavior is covered by
// useDownloadSuccessHref.spec.ts — mock it here as a plain (os, place) => href
// builder so this spec only asserts Hero's wiring (which CTAs call it, what
// data-* attributes they carry).
jest.mock('../../../hooks/useDownloadSuccessHref', () => ({ useDownloadSuccessHref: jest.fn() }))

const mockUserAgent = jest.mocked(useAdvancedUserAgentData)
const mockAsyncMemo = jest.mocked(useAsyncMemo)
const mockDownloadClick = jest.mocked(useDownloadClick)
const mockDownloadSuccessHref = jest.mocked(useDownloadSuccessHref)
const mockHangOut = jest.mocked(useHangOutAction)

const trackDownloadClick = jest.fn()
const downloadSuccessHref = jest.fn()

describe('Hero', () => {
  beforeEach(() => {
    mockDownloadClick.mockReturnValue(trackDownloadClick)
    // Re-armed every test: jest.resetAllMocks() in afterEach wipes the
    // implementation, not just the return value.
    downloadSuccessHref.mockImplementation((os: string, place: string) => `/download_success?os=${os}&place=${place}`)
    mockDownloadSuccessHref.mockReturnValue(downloadSuccessHref)
    mockHangOut.mockReturnValue({
      isDownloadModalOpen: false,
      closeDownloadModal: jest.fn(),
      downloadModalProps: {},
      totalDownloads: '+400K'
    } as unknown as ReturnType<typeof useHangOutAction>)
    mockAsyncMemo.mockReturnValue([500000, { loading: false, loaded: true }] as unknown as ReturnType<typeof useAsyncMemo>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering the main page heading', () => {
    it('should render the desktop hero title as the page <h1>', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Windows' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)

      render(<Hero isDesktop />)

      expect(screen.getByRole('heading', { level: 1, name: 'page.home.hero.title' })).toBeInTheDocument()
    })

    it('should render the mobile hero title as the page <h1>', () => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)

      render(<Hero isDesktop={false} />)

      expect(screen.getByRole('heading', { level: 1, name: 'page.home.hero.mobile_android_title' })).toBeInTheDocument()
    })
  })

  describe('when rendering the desktop hero on a Windows user agent', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Windows' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the macOS platform-switch icon click without altering its href', () => {
      render(<Hero isDesktop />)

      const macIcon = screen.getByAltText('macOS').closest('a') as HTMLAnchorElement
      expect(macIcon?.getAttribute('href')).toContain('/download_success?os=macOS')

      fireEvent.click(macIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
      expect(macIcon).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(macIcon).toHaveAttribute('data-os', 'macOS')
      expect(macIcon).toHaveAttribute('data-place', DownloadPlace.LANDING_HERO_PLATFORM_SWITCH)
    })

    it('should track the iOS QR icon click and still open the QR modal', () => {
      render(<Hero isDesktop />)

      const iosIcon = screen.getByAltText('iOS').closest('a') as HTMLAnchorElement
      expect(iosIcon).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(iosIcon).toHaveAttribute('data-os', 'iOS')
      expect(iosIcon).toHaveAttribute('data-place', DownloadPlace.LANDING_HERO_PLATFORM_SWITCH)
      expect(iosIcon).toHaveAttribute('data-download-target', 'app_store')

      fireEvent.click(iosIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-os', 'ios')
    })

    it('should track the Android QR icon click and still open the QR modal', () => {
      render(<Hero isDesktop />)

      const androidIcon = screen.getByAltText('Android').closest('a') as HTMLAnchorElement
      expect(androidIcon).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(androidIcon).toHaveAttribute('data-os', 'Android')
      expect(androidIcon).toHaveAttribute('data-place', DownloadPlace.LANDING_HERO_PLATFORM_SWITCH)
      expect(androidIcon).toHaveAttribute('data-download-target', 'google_play')

      fireEvent.click(androidIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-os', 'android')
    })

    it('should not alter the main CTA or Epic button tracking already wired by #636', () => {
      render(<Hero isDesktop />)

      const epicButton = screen.getByText('page.download.download_on').closest('a') as HTMLAnchorElement
      expect(epicButton).toHaveAttribute('data-place', DownloadPlace.LANDING_HERO_EPIC)

      fireEvent.click(epicButton)
      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })

    it('should tag the main CTA and platform-switch icon as desktop_installer and Epic as epic', () => {
      render(<Hero isDesktop />)

      const downloadButton = screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement
      const epicButton = screen.getByText('page.download.download_on').closest('a') as HTMLAnchorElement
      const macIcon = screen.getByAltText('macOS').closest('a') as HTMLAnchorElement

      expect(downloadButton).toHaveAttribute('data-download-target', 'desktop_installer')
      // Epic redirects to the Epic Games Store, never reaching download_started —
      // its own target keeps it out of the desktop activation funnel.
      expect(epicButton).toHaveAttribute('data-download-target', 'epic')
      expect(macIcon).toHaveAttribute('data-download-target', 'desktop_installer')
    })
  })

  describe('when building download hrefs', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Windows' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should call the shared useDownloadSuccessHref builder for the main CTA and platform-switch icon', () => {
      // UTM/anon_user_id forwarding is a useDownloadSuccessHref concern, covered
      // in useDownloadSuccessHref.spec.ts — this asserts Hero wires os/place
      // through to it correctly for both call sites.
      render(<Hero isDesktop />)

      expect(downloadSuccessHref).toHaveBeenCalledWith('Windows', DownloadPlace.LANDING_HERO)
      expect(downloadSuccessHref).toHaveBeenCalledWith('macOS', DownloadPlace.LANDING_HERO_PLATFORM_SWITCH)
    })
  })

  describe('when the user agent has not resolved yet', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, undefined] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
    })

    it('should preserve campaign params on the /download fallback href', () => {
      // A partner-attributed click during the user-agent detection window must
      // not strip the utm params — /download's own CTAs re-read them from its
      // URL, so losing them here would break the whole funnel attribution.
      window.history.pushState({}, '', '/?utm_source=shefi')
      try {
        render(<Hero isDesktop />)
        const downloadButton = screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement
        expect(downloadButton).toHaveAttribute('href', '/download?utm_source=shefi')
      } finally {
        window.history.pushState({}, '', '/')
      }
    })
  })

  describe('when rendering the desktop hero on a macOS user agent', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'macOS' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the Windows platform-switch icon click', () => {
      render(<Hero isDesktop />)

      const winIcon = screen.getByAltText('Windows').closest('a') as HTMLAnchorElement
      fireEvent.click(winIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
      expect(winIcon).toHaveAttribute('data-os', 'Windows')
      expect(winIcon).toHaveAttribute('data-place', DownloadPlace.LANDING_HERO_PLATFORM_SWITCH)
    })
  })

  describe('when rendering on a mobile Android device', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Android' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the Google Play store button click', () => {
      render(<Hero isDesktop={false} />)

      const playButton = screen.getByAltText('Get it on Google Play').closest('a') as HTMLAnchorElement
      expect(playButton).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(playButton).toHaveAttribute('data-os', 'Android')
      expect(playButton).toHaveAttribute('data-place', SectionViewedTrack.LANDING_HERO)
      expect(playButton).toHaveAttribute('data-download-target', 'google_play')

      fireEvent.click(playButton)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('when rendering on a mobile iOS device', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'iOS' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the App Store button click', () => {
      render(<Hero isDesktop={false} />)

      const appStoreButton = screen.getByAltText('Download on the App Store').closest('a') as HTMLAnchorElement
      expect(appStoreButton).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(appStoreButton).toHaveAttribute('data-os', 'iOS')
      expect(appStoreButton).toHaveAttribute('data-place', SectionViewedTrack.LANDING_HERO)
      expect(appStoreButton).toHaveAttribute('data-download-target', 'app_store')

      fireEvent.click(appStoreButton)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })
  })
})

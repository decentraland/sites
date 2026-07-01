import { fireEvent, render, screen } from '@testing-library/react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { useDownloadClick } from '../../../hooks/useDownloadClick'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { DownloadPlace, SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { ComeHangOut } from './ComeHangOut'

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
    AnimatedBackground: () => <div data-testid="animated-background" />,
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

jest.mock('../../../modules/explorerDownloads', () => ({
  ExplorerDownloads: { get: jest.fn(() => ({ getTotalDownloads: jest.fn().mockResolvedValue(500000) })) }
}))

const mockUserAgent = jest.mocked(useAdvancedUserAgentData)
const mockAsyncMemo = jest.mocked(useAsyncMemo)
const mockDownloadClick = jest.mocked(useDownloadClick)
const mockHangOut = jest.mocked(useHangOutAction)

const trackDownloadClick = jest.fn()

describe('ComeHangOut', () => {
  beforeEach(() => {
    mockDownloadClick.mockReturnValue(trackDownloadClick)
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

  describe('when rendering the desktop content on a Windows user agent', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Windows' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the Epic button click without altering its href', () => {
      render(<ComeHangOut />)

      const epicButton = screen.getByText('page.download.download_on').closest('a') as HTMLAnchorElement
      expect(epicButton).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(epicButton).toHaveAttribute('data-place', DownloadPlace.COME_HANG_OUT)

      fireEvent.click(epicButton)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })

    it('should track the macOS platform-switch icon click', () => {
      render(<ComeHangOut />)

      const macIcon = screen.getByAltText('macOS').closest('a') as HTMLAnchorElement
      expect(macIcon).toHaveAttribute('href', `/download_success?os=macOS&place=${DownloadPlace.COME_HANG_OUT}`)
      expect(macIcon).toHaveAttribute('data-os', 'macOS')
      expect(macIcon).toHaveAttribute('data-place', DownloadPlace.COME_HANG_OUT_PLATFORM_SWITCH)

      fireEvent.click(macIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })

    it('should track the iOS QR icon click and still open the QR modal', () => {
      render(<ComeHangOut />)

      const iosIcon = screen.getByAltText('iOS').closest('a') as HTMLAnchorElement
      expect(iosIcon).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(iosIcon).toHaveAttribute('data-os', 'iOS')
      expect(iosIcon).toHaveAttribute('data-place', DownloadPlace.COME_HANG_OUT_PLATFORM_SWITCH)

      fireEvent.click(iosIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-os', 'ios')
    })

    it('should track the Android QR icon click and still open the QR modal', () => {
      render(<ComeHangOut />)

      const androidIcon = screen.getByAltText('Android').closest('a') as HTMLAnchorElement
      expect(androidIcon).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(androidIcon).toHaveAttribute('data-os', 'Android')
      expect(androidIcon).toHaveAttribute('data-place', DownloadPlace.COME_HANG_OUT_PLATFORM_SWITCH)

      fireEvent.click(androidIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-open', 'true')
      expect(screen.getByTestId('download-qr-modal')).toHaveAttribute('data-os', 'android')
    })
  })

  describe('when rendering the desktop content on a macOS user agent', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'macOS' }, mobile: false }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the Windows platform-switch icon click', () => {
      render(<ComeHangOut />)

      const winIcon = screen.getByAltText('Windows').closest('a') as HTMLAnchorElement
      expect(winIcon).toHaveAttribute('href', `/download_success?os=Windows&place=${DownloadPlace.COME_HANG_OUT}`)
      expect(winIcon).toHaveAttribute('data-os', 'Windows')
      expect(winIcon).toHaveAttribute('data-place', DownloadPlace.COME_HANG_OUT_PLATFORM_SWITCH)

      fireEvent.click(winIcon)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('when rendering on a mobile Android device', () => {
    beforeEach(() => {
      mockUserAgent.mockReturnValue([false, { os: { name: 'Android' }, mobile: true }] as unknown as ReturnType<
        typeof useAdvancedUserAgentData
      >)
    })

    it('should track the Google Play store button click', () => {
      render(<ComeHangOut />)

      const playButton = screen.getByAltText('Get it on Google Play').closest('a') as HTMLAnchorElement
      expect(playButton).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(playButton).toHaveAttribute('data-os', 'Android')
      expect(playButton).toHaveAttribute('data-place', SectionViewedTrack.LANDING_COME_HANG_OUT)

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
      render(<ComeHangOut />)

      const appStoreButton = screen.getByAltText('Download on the App Store').closest('a') as HTMLAnchorElement
      expect(appStoreButton).toHaveAttribute('data-event', SegmentEvent.DOWNLOAD)
      expect(appStoreButton).toHaveAttribute('data-os', 'iOS')
      expect(appStoreButton).toHaveAttribute('data-place', SectionViewedTrack.LANDING_COME_HANG_OUT)

      fireEvent.click(appStoreButton)

      expect(trackDownloadClick).toHaveBeenCalledTimes(1)
    })
  })
})

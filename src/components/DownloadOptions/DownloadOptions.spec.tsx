import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import { DOWNLOAD_URLS } from '../../modules/downloadConstants'
import { getDownloadLinkWithIdentity } from '../../modules/downloadWithIdentity'
import { postSegmentEvent } from '../../modules/segmentBeacon'
import type { DownloadOptionProps } from '../../types/download.types'
import { DownloadOptions, handleDownloadOptionClick } from './DownloadOptions'

// Keep ../../modules/url REAL so the actual /download_success URL is built and
// we can assert UTM preservation end-to-end. Mock only the decentraland-ui2
// entry points url.ts (and this component) pull in at module load.
jest.mock('decentraland-ui2/dist/modules/cdnReleases', () => ({
  CDNSource: { LAUNCHER: 'LAUNCHER', AUTO_SIGNING: 'AUTO_SIGNING' },
  getCDNRelease: jest.fn(() => ({
    Windows: { x64: 'https://cdn.decentraland.org/launcher/win.exe' },
    macOS: { arm64: 'https://cdn.decentraland.org/launcher/mac.dmg' }
  }))
}))

jest.mock('decentraland-ui2/dist/config', () => ({ config: { get: () => undefined } }))

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: jest.fn(() => [false, undefined]),
  // Invoke the factory so the download-count fetch closure is exercised, then
  // return a stable [value, status] tuple like the real hook.
  useAsyncMemo: jest.fn((factory: () => Promise<unknown>) => {
    void factory()
    return [undefined, { loading: false, loaded: false }]
  })
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockTrackDownloadClick = jest.fn()
jest.mock('../../hooks/useDownloadClick', () => ({ useDownloadClick: () => mockTrackDownloadClick }))

const mockAnonUserId = jest.fn<string | undefined, []>(() => undefined)
jest.mock('../../hooks/useAnonUserId', () => ({ ANON_USER_ID_PARAM: 'anon_user_id', useAnonUserId: () => mockAnonUserId() }))

jest.mock('../../hooks/useGetIdentityId', () => ({ useGetIdentityId: () => () => Promise.resolve(undefined) }))

jest.mock('../../modules/downloadWithIdentity', () => ({
  ...jest.requireActual('../../modules/downloadWithIdentity'),
  getDownloadLinkWithIdentity: jest.fn()
}))

jest.mock('../../modules/segmentBeacon', () => ({ postSegmentEvent: jest.fn() }))

jest.mock('../../modules/segmentAnonymousId', () => ({ ensureSegmentAnonymousId: jest.fn(() => 'anon-id') }))

jest.mock('../../modules/explorerDownloads', () => ({
  ExplorerDownloads: { get: () => ({ getTotalDownloads: () => Promise.resolve(0) }) }
}))

jest.mock('../Icon/VerifiedIcon', () => ({ VerifiedIcon: () => null }))

// Styled components → thin DOM passthroughs so we can assert data-* attributes,
// href and click behavior without the styled engine. `require('react')` lives
// inside each factory because jest hoists jest.mock() above module-scope
// declarations, and its transform rejects factories that reference
// out-of-scope variables.
jest.mock('../Home/Hero/Hero.styled', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anchor = ({ children, startIcon, variant, color, ...rest }: any) => ReactLib.createElement('a', rest, children)
  return { DownloadButton: anchor, EpicButton: anchor }
})
jest.mock('./DownloadOptions.styled', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anchor = ({ children, startIcon, variant, color, ...rest }: any) => ReactLib.createElement('a', rest, children)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const div = ({ children }: any) => ReactLib.createElement('div', null, children)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const img = (props: any) => ReactLib.createElement('img', props)
  return {
    AlternativeButton: anchor,
    AlternativeButtonImage: img,
    AlternativeButtonsWrapper: div,
    AlternativeContainer: div,
    DownloadActions: div,
    DownloadButtonsContainer: div,
    DownloadCounts: div,
    DownloadOptionsContainer: div
  }
})

const mockUseAdvancedUserAgentData = jest.mocked(useAdvancedUserAgentData)
const mockUseAsyncMemo = jest.mocked(useAsyncMemo)
const mockGetDownloadLinkWithIdentity = jest.mocked(getDownloadLinkWithIdentity)
const mockGetCDNRelease = jest.mocked(getCDNRelease)

const asyncMemoStub = (value: unknown, loaded: boolean) => (factory: () => Promise<unknown>) => {
  void factory()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [value, { loading: false, loaded }] as any
}

const setWindowsUserAgent = () =>
  mockUseAdvancedUserAgentData.mockReturnValue([
    false,
    { os: { name: 'Windows' }, cpu: { architecture: 'x64' }, mobile: false }
  ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)

// Swap window.location for a stub that records href assignments (the redirect)
// and exposes a controllable search — jsdom cannot actually navigate.
const installLocation = (search: string) => {
  const hrefSpy = jest.fn()
  const originalLocation = window.location
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      origin: 'http://localhost',
      search,
      get href() {
        return `http://localhost/download${search}`
      },
      set href(value: string) {
        hrefSpy(value)
      }
    }
  })
  return { hrefSpy, restore: () => Object.defineProperty(window, 'location', { configurable: true, value: originalLocation }) }
}

describe('DownloadOptions', () => {
  beforeEach(() => {
    setWindowsUserAgent()
    mockAnonUserId.mockReturnValue(undefined)
    mockGetCDNRelease.mockReturnValue({
      Windows: { x64: 'https://cdn.decentraland.org/launcher/win.exe' },
      macOS: { arm64: 'https://cdn.decentraland.org/launcher/mac.dmg' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    mockUseAsyncMemo.mockImplementation(asyncMemoStub(undefined, false))
  })

  afterEach(() => {
    jest.clearAllMocks()
    window.history.pushState({}, '', '/')
  })

  describe('when the desktop installer CTA is clicked with partner UTM params on the URL', () => {
    it('should preserve the campaign params into the /download_success redirect URL', async () => {
      const hrefSpy = jest.fn()
      const originalLocation = window.location
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          origin: 'http://localhost',
          search: '?utm_source=shefi&utm_campaign=partner-launch',
          get href() {
            return 'http://localhost/download'
          },
          set href(value: string) {
            hrefSpy(value)
          }
        }
      })

      try {
        render(<DownloadOptions />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)

        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        const redirectUrl = hrefSpy.mock.calls[0][0] as string
        expect(redirectUrl).toContain('/download_success')
        expect(redirectUrl).toContain('os=Windows')
        expect(redirectUrl).toContain('arch=x64')
        expect(redirectUrl).toContain('place=download-page')
        expect(redirectUrl).toContain('utm_source=shefi')
        expect(redirectUrl).toContain('utm_campaign=partner-launch')
      } finally {
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
      }
    })

    it('should fire the download click tracker', async () => {
      // installLocation fences the deferred `window.location.href =` redirect
      // (setTimeout in onClickDownloadHandler) so it can't leak a jsdom
      // "Not implemented: navigation" into a later test.
      const { hrefSpy, restore } = installLocation('')
      try {
        render(<DownloadOptions />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        expect(mockTrackDownloadClick).toHaveBeenCalledTimes(1)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
      } finally {
        restore()
      }
    })

    it('should redirect to /download_success with os, place, anon_user_id and arch', async () => {
      // Preserves the coverage of the shared buildDownloadSuccessHref contract
      // (os + place + anon_user_id + arch) alongside the campaign params.
      mockAnonUserId.mockReturnValue('11111111-1111-4111-8111-111111111111')
      const { hrefSpy, restore } = installLocation('')
      try {
        render(<DownloadOptions />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        const redirectUrl = hrefSpy.mock.calls[0][0] as string
        expect(redirectUrl).toContain('/download_success')
        expect(redirectUrl).toContain('os=Windows')
        expect(redirectUrl).toContain('place=download-page')
        expect(redirectUrl).toContain('anon_user_id=11111111-1111-4111-8111-111111111111')
        expect(redirectUrl).toContain('arch=x64')
      } finally {
        restore()
      }
    })
  })

  describe('download_target dimension', () => {
    it('should tag the primary desktop installer button with download_target=desktop_installer', () => {
      render(<DownloadOptions />)
      const button = screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement
      expect(button).toHaveAttribute('data-download-target', 'desktop_installer')
    })

    it('should tag the Epic button with download_target=epic', () => {
      render(<DownloadOptions />)
      const epicButton = screen.getByText('page.download.download_on').closest('a') as HTMLAnchorElement
      // Epic redirects to the Epic Games Store, never reaching download_started —
      // its own target keeps it out of the desktop activation funnel.
      expect(epicButton).toHaveAttribute('data-download-target', 'epic')
    })

    it('should tag the secondary platform option (macOS) with download_target=desktop_installer', () => {
      render(<DownloadOptions />)
      const macOption = screen.getByLabelText('macOS')
      expect(macOption).toHaveAttribute('data-download-target', 'desktop_installer')
      // These two are new in this PR and change the Click payload's place
      // bucketing for secondary options — pin them alongside the target.
      expect(macOption).toHaveAttribute('data-place', 'download-page')
      expect(macOption).toHaveAttribute('data-event', 'Download')
    })

    it('should tag the App Store badge as a store exit (app_store) pointing at the App Store', () => {
      render(<DownloadOptions />)
      const appStore = screen.getByLabelText('iOS')
      expect(appStore).toHaveAttribute('data-download-target', 'app_store')
      expect(appStore).toHaveAttribute('data-os', 'iOS')
      expect(appStore).toHaveAttribute('href', DOWNLOAD_URLS.appStore)
    })

    it('should tag the Google Play badge as a store exit (google_play) pointing at Google Play', () => {
      render(<DownloadOptions />)
      const googlePlay = screen.getByLabelText('Google Play')
      expect(googlePlay).toHaveAttribute('data-download-target', 'google_play')
      expect(googlePlay).toHaveAttribute('data-os', 'Android')
      expect(googlePlay).toHaveAttribute('href', DOWNLOAD_URLS.googlePlay)
    })

    it('should fire the tracker when a store badge is clicked (unload-safe path handled by useDownloadClick)', async () => {
      render(<DownloadOptions />)
      await userEvent.click(screen.getByLabelText('iOS'))
      expect(mockTrackDownloadClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('platform-specific rendering', () => {
    it('should render a Windows primary and macOS secondary when the user agent is unknown', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([false, undefined] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      render(<DownloadOptions />)
      expect(screen.getByText('page.download.download_for_short')).toBeInTheDocument()
      expect(screen.getByLabelText('macOS')).toBeInTheDocument()
    })

    it('should render a macOS primary and a Windows secondary on macOS', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([
        false,
        { os: { name: 'macOS' }, cpu: { architecture: 'arm64' }, mobile: false }
      ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      render(<DownloadOptions />)
      expect(screen.getByLabelText('Windows')).toBeInTheDocument()
    })

    it('should render nothing while the user agent is still loading', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([true, undefined] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      const { container } = render(<DownloadOptions />)
      expect(container).toBeEmptyDOMElement()
    })

    it('should render the download counts once the total resolves', () => {
      mockUseAsyncMemo.mockImplementation(asyncMemoStub(1234, true))
      render(<DownloadOptions />)
      expect(screen.getByText(/page\.download\.total_downloads/)).toBeInTheDocument()
    })

    it('should render no download actions when the CDN release has no links at all', () => {
      mockGetCDNRelease.mockReturnValue({} as unknown as ReturnType<typeof getCDNRelease>)
      mockUseAdvancedUserAgentData.mockReturnValue([false, undefined] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      render(<DownloadOptions />)
      expect(screen.queryByText('page.download.download_for_short')).not.toBeInTheDocument()
    })

    it('should render no primary button when the detected OS has no matching CDN link', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([
        false,
        { os: { name: 'Linux' }, cpu: { architecture: 'x64' }, mobile: false }
      ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      render(<DownloadOptions />)
      expect(screen.queryByText('page.download.download_for_short')).not.toBeInTheDocument()
    })

    it('should skip rendering a primary option whose CDN link is missing for the detected arch', () => {
      mockUseAdvancedUserAgentData.mockReturnValue([
        false,
        { os: { name: 'Windows' }, cpu: { architecture: 'ia32' }, mobile: false }
      ] as unknown as ReturnType<typeof useAdvancedUserAgentData>)
      render(<DownloadOptions />)
      // The primary option exists but its arch link is undefined, so the button
      // is not rendered (the `option.link ? … : null` branch).
      expect(screen.queryByText('page.download.download_for_short')).not.toBeInTheDocument()
    })
  })

  describe('when the URL carries first-launch deep-link params', () => {
    it('should forward position and realm into the /download_success redirect URL', async () => {
      const { hrefSpy, restore } = installLocation('?position=10,20&realm=foo.eth')
      try {
        render(<DownloadOptions />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        const redirectUrl = hrefSpy.mock.calls[0][0] as string
        expect(redirectUrl).toContain('position=10%2C20')
        expect(redirectUrl).toContain('realm=foo.eth')
      } finally {
        restore()
      }
    })

    it('should forward position and realm into the file URL query params when downloadOnClick is set', async () => {
      const { hrefSpy, restore } = installLocation('?position=10,20&realm=foo.eth')
      mockGetDownloadLinkWithIdentity.mockResolvedValue(undefined as never)
      try {
        render(<DownloadOptions downloadOnClick />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        expect(mockGetDownloadLinkWithIdentity).toHaveBeenCalledWith(
          expect.objectContaining({
            queryParams: expect.objectContaining({ position: '10,20', realm: 'foo.eth' })
          })
        )
      } finally {
        restore()
      }
    })

    it('should mint an anon_user_id for deep-link downloads so they stay on the gateway route', async () => {
      // No anon_user_id from URL/Segment, but position/realm are present — the
      // installer must come from the gateway, which needs an anon id, so one is
      // minted rather than falling back to the CDN.
      mockAnonUserId.mockReturnValue(undefined)
      const { hrefSpy, restore } = installLocation('?position=10,20&realm=foo.eth')
      mockGetDownloadLinkWithIdentity.mockResolvedValue(undefined as never)
      try {
        render(<DownloadOptions downloadOnClick />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        expect(mockGetDownloadLinkWithIdentity).toHaveBeenCalledWith(
          expect.objectContaining({
            anonUserId: 'anon-id',
            queryParams: expect.objectContaining({ anon_user_id: 'anon-id' })
          })
        )
      } finally {
        restore()
      }
    })

    it('should not mint an anon_user_id when there are no deep-link params', async () => {
      mockAnonUserId.mockReturnValue(undefined)
      const { hrefSpy, restore } = installLocation('')
      mockGetDownloadLinkWithIdentity.mockResolvedValue(undefined as never)
      try {
        render(<DownloadOptions downloadOnClick />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        expect(mockGetDownloadLinkWithIdentity).toHaveBeenCalledWith(expect.objectContaining({ anonUserId: undefined }))
      } finally {
        restore()
      }
    })

    it('should not forward default position and realm values', async () => {
      const { hrefSpy, restore } = installLocation('?position=0,0&realm=main')
      try {
        render(<DownloadOptions />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        const redirectUrl = hrefSpy.mock.calls[0][0] as string
        expect(redirectUrl).not.toContain('position=')
        expect(redirectUrl).not.toContain('realm=')
      } finally {
        restore()
      }
    })
  })

  describe('when downloadOnClick is set', () => {
    it('should trigger the identity-bound download before redirecting', async () => {
      const { hrefSpy, restore } = installLocation('')
      mockGetDownloadLinkWithIdentity.mockResolvedValue(undefined as never)
      try {
        render(<DownloadOptions downloadOnClick />)
        await userEvent.click(screen.getByText('page.download.download_for_short').closest('a') as HTMLAnchorElement)
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        expect(mockGetDownloadLinkWithIdentity).toHaveBeenCalled()
      } finally {
        restore()
      }
    })

    describe('and the in-page download dispatch rejects', () => {
      let callDownloadHandler: () => Promise<void>
      let downloadOption: DownloadOptionProps
      let getIdentityId: jest.Mock<Promise<string | undefined>, []>
      let links: Record<string, Record<string, string>>

      beforeEach(() => {
        downloadOption = {
          text: 'Windows',
          image: '',
          link: 'https://cdn.decentraland.org/launcher/win.exe',
          arch: 'x64'
        }
        getIdentityId = jest.fn(() => Promise.resolve(undefined))
        links = { Windows: { x64: 'https://cdn.decentraland.org/launcher/win.exe' } }
        mockGetDownloadLinkWithIdentity.mockRejectedValue(new Error('gateway 500'))
        callDownloadHandler = () =>
          handleDownloadOptionClick({
            downloadOnClick: true,
            getIdentityId,
            links,
            option: downloadOption
          })
      })

      it('should fire download_redirect_failed on dispatch failure', async () => {
        await expect(callDownloadHandler()).rejects.toThrow('gateway 500')
        expect(postSegmentEvent).toHaveBeenCalledWith(
          'download_redirect_failed',
          expect.objectContaining({ reason: 'gateway 500', place: 'download-page', download_target: 'desktop_installer' }),
          expect.any(String)
        )
      })

      it('should NOT change navigation behavior on failure (tracking-only: flow preserved)', async () => {
        const { hrefSpy, restore } = installLocation('')
        try {
          const hrefBefore = window.location.href
          await expect(callDownloadHandler()).rejects.toThrow('gateway 500')
          expect(postSegmentEvent).toHaveBeenCalled()
          expect(hrefSpy).not.toHaveBeenCalled()
          expect(window.location.href).toBe(hrefBefore)
        } finally {
          restore()
        }
      })
    })
  })

  describe('when a secondary platform option is clicked', () => {
    it('should redirect through /download_success for that platform', async () => {
      const { hrefSpy, restore } = installLocation('')
      try {
        render(<DownloadOptions />)
        await userEvent.click(screen.getByLabelText('macOS'))
        await waitFor(() => expect(hrefSpy).toHaveBeenCalled())
        expect(hrefSpy.mock.calls[0][0]).toContain('os=macOS')
      } finally {
        restore()
      }
    })
  })
})

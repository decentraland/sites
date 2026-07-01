import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DownloadPlace, SegmentEvent } from '../../modules/segment'
import { CreatorHubDownloadSuccess } from './CreatorHubDownloadSuccess'

// download_success fires via createDownloadTracker, which now posts directly
// through the unload-safe beacon transport (see downloadTracking.ts) instead
// of useDeferredTrack. Mock that transport rather than the hook.
const mockPostSegmentEvent = jest.fn()
jest.mock('../../modules/segmentBeacon', () => ({
  postSegmentEvent: (...args: unknown[]) => mockPostSegmentEvent(...args)
}))
jest.mock('../../modules/segmentAnonymousId', () => ({
  ensureSegmentAnonymousId: () => 'anon-fixed'
}))

const mockPostSegmentEventClick = jest.fn()
const mockTriggerFileDownload = jest.fn()

let mockAnonUserId: string | undefined = 'anon-xyz'
let mockHasValidIdentity = false
let mockLinks: Record<string, Record<string, string>> | undefined
let mockLinksLoading = false
let searchParamsInstance = new URLSearchParams('os=macos&arch=arm64')

const MAC_LINK = 'https://cdn.example.com/Decentraland-Creator-Hub-arm64.dmg'
const WIN_LINK = 'https://cdn.example.com/Creator-Hub-Setup.exe'

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParamsInstance, jest.fn()]
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    intl: {
      formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) => {
        if (values?.link) return values.link
        if (values?.span) {
          const spanFn = values.span as (chunks: unknown) => unknown
          return spanFn(id)
        }
        return id
      }
    }
  })
}))

jest.mock('../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockPostSegmentEventClick
}))

jest.mock('../../hooks/useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anon_user_id',
  useAnonUserId: () => mockAnonUserId
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ hasValidIdentity: mockHasValidIdentity })
}))

jest.mock('../../hooks/useLatestGithubRelease', () => ({
  Repo: { CREATOR_HUB: 'creator-hub' },
  useLatestGithubRelease: () => ({ links: mockLinks, loading: mockLinksLoading })
}))

jest.mock('../../modules/file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args)
}))

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

jest.mock('../DownloadSuccess/DownloadSuccessLayout', () => ({
  DownloadSuccessLayout: (props: { footer?: React.ReactNode }) => (
    <div data-testid="layout">
      <div data-testid="footer">{props.footer}</div>
    </div>
  )
}))

describe('CreatorHubDownloadSuccess', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockAnonUserId = 'anon-xyz'
    mockHasValidIdentity = false
    mockLinks = { macOS: { arm64: MAC_LINK }, Windows: { amd64: WIN_LINK } }
    mockLinksLoading = false
    searchParamsInstance = new URLSearchParams('os=macos&arch=arm64')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the page mounts after a macOS download', () => {
    it('should fire download_success once with the creator-hub-success-page place and a derived filename', async () => {
      render(<CreatorHubDownloadSuccess />)

      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(1))
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_SUCCESS,
        expect.objectContaining({
          href: MAC_LINK,
          os: 'macOS',
          arch: 'arm64',
          place: DownloadPlace.CREATOR_HUB_SUCCESS_PAGE,
          filename: 'Decentraland-Creator-Hub-arm64.dmg',

          anon_user_id: 'anon-xyz',

          auth_state: 'anonymous',
          revisit: 0
        }),
        'anon-fixed'
      )
    })

    it('should report auth_state authenticated when the visitor has a valid identity', async () => {
      mockHasValidIdentity = true
      render(<CreatorHubDownloadSuccess />)

      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(1))
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_SUCCESS,

        expect.objectContaining({ auth_state: 'authenticated' }),
        'anon-fixed'
      )
    })

    it('should increment the revisit counter on a second mount for the same os:arch', async () => {
      const first = render(<CreatorHubDownloadSuccess />)
      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(1))
      first.unmount()

      render(<CreatorHubDownloadSuccess />)
      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(2))

      expect(mockPostSegmentEvent.mock.calls[1][1]).toEqual(expect.objectContaining({ revisit: 1 }))
    })
  })

  describe('when the release links have not loaded yet', () => {
    beforeEach(() => {
      mockLinks = undefined
      mockLinksLoading = true
    })

    it('should not fire download_success without an osLink', async () => {
      render(<CreatorHubDownloadSuccess />)

      await Promise.resolve()
      expect(mockPostSegmentEvent).not.toHaveBeenCalled()
    })
  })

  describe('when the os param is windows', () => {
    beforeEach(() => {
      searchParamsInstance = new URLSearchParams('os=windows&arch=amd64')
    })

    it('should fire download_success with the windows link and filename', async () => {
      render(<CreatorHubDownloadSuccess />)

      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(1))
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_SUCCESS,
        expect.objectContaining({ os: 'Windows', arch: 'amd64', filename: 'Creator-Hub-Setup.exe' }),
        'anon-fixed'
      )
    })
  })

  describe('when the arch param is invalid', () => {
    beforeEach(() => {
      searchParamsInstance = new URLSearchParams('os=macos&arch=bogus')
    })

    it('should fall back to the default arch for the os', async () => {
      render(<CreatorHubDownloadSuccess />)

      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(1))
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_SUCCESS,
        expect.objectContaining({ arch: 'arm64' }),
        'anon-fixed'
      )
    })
  })

  describe('when the footer re-download link is clicked', () => {
    it('should track the click and trigger the download again', async () => {
      render(<CreatorHubDownloadSuccess />)
      await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledTimes(1))

      fireEvent.click(screen.getByText('page.creator-hub.download.success.footer_link_label'))

      expect(mockPostSegmentEventClick).toHaveBeenCalledTimes(1)
      expect(mockTriggerFileDownload).toHaveBeenCalledWith(MAC_LINK)
    })
  })
})

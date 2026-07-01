import { act, renderHook } from '@testing-library/react'
import { DownloadPlace, SegmentEvent } from '../modules/segment'
import { useCreatorHubDownload } from './useCreatorHubDownload'

// download_started fires via createDownloadTracker, which now posts directly
// through the unload-safe beacon transport (see downloadTracking.ts) instead
// of useDeferredTrack. Mock that transport rather than the hook.
const mockPostSegmentEvent = jest.fn()
jest.mock('../modules/segmentBeacon', () => ({
  postSegmentEvent: (...args: unknown[]) => mockPostSegmentEvent(...args)
}))
jest.mock('../modules/segmentAnonymousId', () => ({
  ensureSegmentAnonymousId: () => 'anon-fixed'
}))

const mockTriggerFileDownload = jest.fn()

let mockAnonUserId: string | undefined = 'anon-xyz'
let mockHasValidIdentity = false
let mockUserAgent: [boolean, { os: { name: string }; cpu: { architecture: string } } | undefined] = [
  false,
  { os: { name: 'macOS' }, cpu: { architecture: 'arm64' } }
]
let mockLinks: Record<string, Record<string, string>> | undefined
let mockLinksLoading = false

jest.mock('@dcl/hooks', () => ({
  useAdvancedUserAgentData: () => mockUserAgent
}))

jest.mock('./useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anon_user_id',
  useAnonUserId: () => mockAnonUserId
}))

jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: () => ({ hasValidIdentity: mockHasValidIdentity })
}))

jest.mock('./useLatestGithubRelease', () => ({
  Repo: { CREATOR_HUB: 'creator-hub' },
  useLatestGithubRelease: () => ({ links: mockLinks, loading: mockLinksLoading })
}))

jest.mock('../modules/file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args)
}))

jest.mock('../modules/url', () => ({
  addQueryParamsToUrlString: (url: string, params: Record<string, string | undefined | null>) => {
    const u = new URL(url)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) u.searchParams.append(key, value)
    })
    return u.toString()
  },
  updateUrlWithLastValue: (url: string, key: string, value: string) => {
    const u = new URL(url)
    u.searchParams.delete(key)
    u.searchParams.append(key, value)
    return u.toString()
  }
}))

const MAC_LINK = 'https://cdn.example.com/Decentraland-Creator-Hub-arm64.dmg'
const WIN_LINK = 'https://cdn.example.com/Creator-Hub-Setup.exe'

const originalLocation = window.location

describe('useCreatorHubDownload', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '', origin: 'http://localhost' }
    })
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation })
  })

  beforeEach(() => {
    jest.useFakeTimers()
    mockAnonUserId = 'anon-xyz'
    mockHasValidIdentity = false
    mockUserAgent = [false, { os: { name: 'macOS' }, cpu: { architecture: 'arm64' } }]
    mockLinks = { macOS: { arm64: MAC_LINK }, Windows: { amd64: WIN_LINK } }
    mockLinksLoading = false
    window.location.href = ''
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when handleDownload is called with a valid option', () => {
    it('should fire download_started with the creator-hub-download-page place and trigger the file download', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      act(() => {
        result.current.handleDownload(result.current.primaryOption!)
      })

      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_STARTED,
        expect.objectContaining({
          href: MAC_LINK,
          os: 'macOS',
          arch: 'arm64',
          place: DownloadPlace.CREATOR_HUB_DOWNLOAD_PAGE,

          anon_user_id: 'anon-xyz',

          auth_state: 'anonymous',
          revisit: 0,

          started_at: expect.any(Number)
        }),
        'anon-fixed'
      )
      expect(mockTriggerFileDownload).toHaveBeenCalledWith(MAC_LINK)
    })

    it('should report auth_state authenticated when the visitor has a valid identity', () => {
      mockHasValidIdentity = true
      const { result } = renderHook(() => useCreatorHubDownload())

      act(() => {
        result.current.handleDownload(result.current.primaryOption!)
      })

      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        SegmentEvent.DOWNLOAD_STARTED,

        expect.objectContaining({ auth_state: 'authenticated' }),
        'anon-fixed'
      )
    })

    it('should forward arch, os and anon_user_id to the success redirect url', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      act(() => {
        result.current.handleDownload(result.current.primaryOption!)
      })
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(window.location.href).toContain('/download/creator-hub-success')
      expect(window.location.href).toContain('os=macOS')
      expect(window.location.href).toContain('arch=arm64')
      expect(window.location.href).toContain('anon_user_id=anon-xyz')
    })
  })

  describe('when anon_user_id is unavailable', () => {
    beforeEach(() => {
      mockAnonUserId = undefined
    })

    it('should omit anon_user_id from the event payload and the redirect url', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      act(() => {
        result.current.handleDownload(result.current.primaryOption!)
      })
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      const payload = mockPostSegmentEvent.mock.calls[0][1]
      expect(payload).not.toHaveProperty('anon_user_id')
      expect(window.location.href).not.toContain('anon_user_id')
    })
  })

  describe('when the option has no download link', () => {
    it('should not track or trigger a download', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      act(() => {
        result.current.handleDownload({ text: 'macOS', image: 'icon.svg' })
      })

      expect(mockPostSegmentEvent).not.toHaveBeenCalled()
      expect(mockTriggerFileDownload).not.toHaveBeenCalled()
    })
  })

  describe('when handleDownload is called twice with a pending redirect', () => {
    it('should clear the previous redirect timer and re-fire the funnel', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      act(() => {
        result.current.handleDownload(result.current.primaryOption!)
      })
      act(() => {
        result.current.handleDownload(result.current.primaryOption!)
      })

      expect(mockPostSegmentEvent).toHaveBeenCalledTimes(2)
      expect(mockTriggerFileDownload).toHaveBeenCalledTimes(2)
    })
  })

  describe('when the visitor OS has no available download', () => {
    beforeEach(() => {
      mockUserAgent = [false, { os: { name: 'Linux' }, cpu: { architecture: 'amd64' } }]
    })

    it('should expose no primary option', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      expect(result.current.primaryOption).toBeNull()
    })
  })

  describe('when user agent data is still loading', () => {
    beforeEach(() => {
      mockLinksLoading = true
    })

    it('should report not ready', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      expect(result.current.isReady).toBe(false)
    })
  })

  describe('when the visitor is on Windows', () => {
    beforeEach(() => {
      mockUserAgent = [false, { os: { name: 'Windows' }, cpu: { architecture: 'amd64' } }]
    })

    it('should expose macOS as a secondary option', () => {
      const { result } = renderHook(() => useCreatorHubDownload())

      expect(result.current.primaryOption?.text).toBe('Windows')
      expect(result.current.secondaryOptions.map(option => option.text)).toContain('macOS')
    })
  })
})

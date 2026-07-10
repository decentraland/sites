import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { DownloadSuccess } from './DownloadSuccess'

const mockCalculateDownloadUrl = jest.fn()
const mockStreamOrFallback = jest.fn()
// Identity passthrough (keeps `href` assertions on the raw url) but recordable
// so tests can assert which query params the component forwarded to the gateway.
const mockAddQueryParams = jest.fn((url: string, _params?: Record<string, unknown>) => url)
let searchParamsInstance = new URLSearchParams()
// Mutable so individual tests can flip the auth state used by the component.
let mockHasValidIdentity = false

// download_started/success/failed now bypass useDeferredTrack entirely and go
// straight through the unload-safe beacon transport (see downloadTracking.ts).
// Mock it directly rather than @dcl/hooks's `track`, which no longer receives
// these events.
const mockPostSegmentEvent = jest.fn()
jest.mock('../../modules/segmentBeacon', () => ({
  postSegmentEvent: (...args: unknown[]) => mockPostSegmentEvent(...args)
}))
jest.mock('../../modules/segmentAnonymousId', () => ({
  ensureSegmentAnonymousId: () => 'anon-fixed'
}))

const findEventCall = (event: string) => mockPostSegmentEvent.mock.calls.find(([callEvent]) => callEvent === event)

// Real fingerprint values by default so the existing `fp_*` assertions below
// keep working; individual tests can swap the implementation to throw to
// cover the P2-4 regression (a fingerprint failure must not drop campaign
// params or click correlation from buildTrackerExtra).
const mockCollectClientFingerprint = jest.fn(() => ({
  fp_screen_width: 1024,
  fp_screen_height: 768,
  fp_device_pixel_ratio: 1,
  fp_hardware_concurrency: 8,
  fp_timezone: 'UTC',
  fp_language: 'en-US',
  fp_platform: 'MacIntel'
}))
jest.mock('../../modules/fingerprint', () => ({
  collectClientFingerprint: () => mockCollectClientFingerprint()
}))

jest.mock('decentraland-ui2', () => ({
  Logo: () => null,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
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

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParamsInstance, jest.fn()]
}))

// The download_funnel_exit diagnostic: mock the module (which otherwise pulls
// in config/env → import.meta, unloadable under Jest) so we can assert the
// visibilitychange→hidden handler fires it with the right funnel-state snapshot.
const mockSendDownloadFunnelExit = jest.fn()
jest.mock('../../modules/downloadFunnelExit', () => ({
  sendDownloadFunnelExit: (...args: unknown[]) => mockSendDownloadFunnelExit(...args)
}))

// Drive the shared subscribeVisibility primitive used by useDownloadFunnelExit.
const setVisibility = (hidden: boolean): void => {
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true })
  Object.defineProperty(document, 'visibilityState', { value: hidden ? 'hidden' : 'visible', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

const mockUseAnonUserId = jest.fn<string | undefined, []>(() => 'anon-123')
jest.mock('../../hooks/useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anonUserId',
  useAnonUserId: () => mockUseAnonUserId()
}))

jest.mock('../../hooks/useGetIdentityId', () => ({
  useGetIdentityId: () => () => Promise.resolve('id-xyz')
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: mockHasValidIdentity, address: undefined })
}))

jest.mock('../../modules/downloadWithIdentity', () => ({
  calculateDownloadUrl: (...args: unknown[]) => mockCalculateDownloadUrl(...args),
  getDownloadLinkWithIdentity: jest.fn()
}))

jest.mock('../../modules/streamOrFallback', () => ({
  streamOrFallback: (...args: unknown[]) => mockStreamOrFallback(...args)
}))

const mockCaptureDownloadError = jest.fn()
jest.mock('../../modules/downloadFunnelSentry', () => ({
  captureDownloadError: (...args: unknown[]) => mockCaptureDownloadError(...args),
  recordDownloadMilestone: jest.fn()
}))

jest.mock('../../modules/url', () => ({
  FALLBACK_CDN_RELEASE_LINKS: {
    Windows: { amd64: 'https://cdn.decentraland.org/launcher/Install-Decentraland.exe' },
    macOS: { arm64: 'https://cdn.decentraland.org/launcher/Decentraland-arm64.dmg' }
  },
  addQueryParamsToUrlString: (...args: [string, Record<string, unknown>]) => mockAddQueryParams(...args)
}))

type LayoutProps = {
  loading?: boolean
  backdropContent?: React.ReactNode
  footer?: React.ReactNode
  renderCardOverlay?: (step: unknown, index: number) => React.ReactNode
  steps: unknown[]
  afterContent?: React.ReactNode
}

jest.mock('./DownloadSuccessLayout', () => ({
  DownloadSuccessLayout: (props: LayoutProps) => (
    <div data-testid="layout">
      <div data-testid="backdrop">{props.backdropContent}</div>
      <div data-testid="footer-slot">{props.footer}</div>
      <div data-testid="step-overlay">{props.renderCardOverlay?.(props.steps[0], 0)}</div>
      {props.afterContent}
    </div>
  )
}))

jest.mock('./DownloadSuccess.styled', () => ({
  DownloadBackdropContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DownloadBackdropText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  DownloadDetailContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DownloadProgressBar: () => <div />,
  DownloadProgressContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HighlightAnimation: () => <div />
}))

jest.mock('../../components/LandingFooter', () => ({
  LandingFooter: () => <div data-testid="footer" />
}))

beforeEach(() => {
  // jest.resetAllMocks() in each suite's afterEach wipes implementations, so
  // re-establish the default anon id (resolved immediately) before every test.
  mockUseAnonUserId.mockReturnValue('anon-123')
  // Restore the identity passthrough wiped by resetAllMocks.
  mockAddQueryParams.mockImplementation((url: string) => url)
  mockCollectClientFingerprint.mockReturnValue({
    fp_screen_width: 1024,
    fp_screen_height: 768,
    fp_device_pixel_ratio: 1,
    fp_hardware_concurrency: 8,
    fp_timezone: 'UTC',
    fp_language: 'en-US',
    fp_platform: 'MacIntel'
  })
})

describe('when DownloadSuccess mounts with os, place, and a successful url resolution', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 4 * 1024 * 1024 })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire download_started with the resolved downloadUrl as href (not the CDN fallback)', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_started',
        expect.objectContaining({
          place: 'landing-hero',
          href: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
          os: 'Windows',
          arch: 'amd64',
          anon_user_id: 'anon-123',
          auth_state: 'anonymous',
          revisit: 0,
          fp_screen_width: expect.any(Number),
          fp_screen_height: expect.any(Number)
        }),
        'anon-fixed'
      )
    })

    const startedCall = findEventCall('download_started')
    expect(startedCall?.[1]).toHaveProperty('started_at', expect.any(Number))
  })

  it('should fire download_success with the same downloadUrl, filename, bytes_transferred, and duration_ms', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_success',
        expect.objectContaining({
          place: 'landing-hero',
          href: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
          filename: 'Install-Decentraland.exe',
          os: 'Windows',
          arch: 'amd64',
          anon_user_id: 'anon-123',
          auth_state: 'anonymous',
          revisit: 0,
          bytes_transferred: 4 * 1024 * 1024,
          fp_screen_width: expect.any(Number),
          fp_device_pixel_ratio: expect.any(Number)
        }),
        'anon-fixed'
      )
    })

    const successCall = findEventCall('download_success')
    expect(successCall?.[1]).toHaveProperty('started_at', expect.any(Number))
    expect(successCall?.[1]).toHaveProperty('succeeded_at', expect.any(Number))
    expect(successCall?.[1]).toHaveProperty('duration_ms', expect.any(Number))
  })

  it('should fire download_started BEFORE download_success (intent-then-outcome ordering)', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything())
    })

    const startedIdx = mockPostSegmentEvent.mock.calls.findIndex(([event]) => event === 'download_started')
    const successIdx = mockPostSegmentEvent.mock.calls.findIndex(([event]) => event === 'download_success')
    expect(startedIdx).toBeGreaterThanOrEqual(0)
    expect(successIdx).toBeGreaterThan(startedIdx)
  })

  it('should report auth_state="authenticated" when there is a valid identity in localStorage', async () => {
    mockHasValidIdentity = true
    try {
      render(<DownloadSuccess />)
      await waitFor(() => {
        expect(mockPostSegmentEvent).toHaveBeenCalledWith(
          'download_started',
          expect.objectContaining({ auth_state: 'authenticated' }),
          expect.anything()
        )
        expect(mockPostSegmentEvent).toHaveBeenCalledWith(
          'download_success',
          expect.objectContaining({ auth_state: 'authenticated' }),
          expect.anything()
        )
      })
    } finally {
      mockHasValidIdentity = false
    }
  })

  it('should omit bytes_transferred from download_success when the stream did not report any (macOS / fallback)', async () => {
    mockStreamOrFallback.mockResolvedValueOnce({})
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything())
    })

    const successCall = findEventCall('download_success')
    expect(successCall?.[1]).not.toHaveProperty('bytes_transferred')
  })
})

describe('when the /download_success URL carries partner campaign params', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=download-page&utm_source=shefi&utm_campaign=partner-q3')
    sessionStorage.clear()
    window.history.replaceState(
      {},
      '',
      '/download_success?os=Windows&arch=amd64&place=download-page&utm_source=shefi&utm_campaign=partner-q3'
    )
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1024 })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should tag download_started with download_target=desktop_installer and the campaign params', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_started',
        expect.objectContaining({
          download_target: 'desktop_installer',
          utm_source: 'shefi',
          utm_campaign: 'partner-q3'
        }),
        'anon-fixed'
      )
    })
  })

  it('should carry the same desktop_installer attribution onto download_success', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_success',
        expect.objectContaining({
          download_target: 'desktop_installer',
          utm_source: 'shefi',
          utm_campaign: 'partner-q3'
        }),
        'anon-fixed'
      )
    })
  })
})

describe('when DownloadSuccess mounts without a place query param', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=macOS&arch=arm64')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=macOS&arch=arm64')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Decentraland.dmg?sig=abc',
      filename: 'Decentraland.dmg'
    })
    mockStreamOrFallback.mockResolvedValue({})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should omit the place field from download_started (UNKNOWN places are not sent)', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_started', expect.anything(), expect.anything())
    })

    const startedCall = findEventCall('download_started')
    expect(startedCall?.[1]).not.toHaveProperty('place')
  })
})

describe('when DownloadSuccess mounts with a place query param that is not in the DownloadPlace enum', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=macOS&arch=arm64&place=attacker-crafted')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=macOS&arch=arm64&place=attacker-crafted')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Decentraland.dmg?sig=abc',
      filename: 'Decentraland.dmg'
    })
    mockStreamOrFallback.mockResolvedValue({})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should coerce place to unknown and then omit it from the payload so cardinality stays bounded', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_started', expect.anything(), expect.anything())
    })

    const startedCall = findEventCall('download_started')
    expect(startedCall?.[1]).not.toHaveProperty('place')
  })
})

describe('when Segment has not finished lazy-loading at mount', () => {
  // Regression guard for the previous race where calculateDownloadUrl resolved
  // before Segment did and the funnel events dropped silently. download_started
  // /success/failed now go through the unload-safe beacon transport
  // (postSegmentEvent + ensureSegmentAnonymousId), which fires immediately
  // regardless of Segment's own lazy-boot state — there is no queue to drain.

  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1024 })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire download_started/success via the beacon transport even though Segment has not booted', async () => {
    render(<DownloadSuccess />)

    // The download itself is attempted regardless of Segment readiness — UX
    // must not be gated on third-party script load.
    await waitFor(() => {
      expect(mockStreamOrFallback).toHaveBeenCalled()
    })

    // Both events fire immediately via the beacon transport — no queueing on
    // Segment's isInitialized flag.
    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_started', expect.anything(), 'anon-fixed')
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), 'anon-fixed')
    })
  })
})

// NOTE: P1-1 removed the sessionStorage + history.state idempotency bails so
// every landing on `/download_success` re-runs the flow with an incremented
// `revisit` counter. The previous "skip auto-download when flag set" tests no
// longer apply — the new behavior is covered by the "revisited within the
// session" describe block below.

describe('when the user clicks the footer re-download link', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero&utm_source=shefi&utm_campaign=partner-launch')
    sessionStorage.setItem('downloadSuccess:triggered:Windows:amd64', '1')
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64')
    mockCalculateDownloadUrl.mockResolvedValue({ url: 'https://cdn.test/Foo.exe', filename: 'Foo.exe' })
    mockStreamOrFallback.mockResolvedValue({})
  })

  afterEach(() => {
    jest.resetAllMocks()
    sessionStorage.clear()
  })

  it('should fire download_started with the footer place and call streamOrFallback', async () => {
    const { findByRole } = render(<DownloadSuccess />)
    const link = await findByRole('link')
    link.click()
    await waitFor(() => {
      expect(mockStreamOrFallback).toHaveBeenCalled()
    })
    expect(mockPostSegmentEvent).toHaveBeenCalledWith(
      'download_started',
      expect.objectContaining({
        place: 'download-success-footer',
        download_target: 'desktop_installer',
        utm_source: 'shefi',
        utm_campaign: 'partner-launch'
      }),
      expect.anything()
    )
    expect(mockPostSegmentEvent).toHaveBeenCalledWith(
      'download_success',
      expect.objectContaining({
        place: 'download-success-footer',
        filename: 'Foo.exe',
        download_target: 'desktop_installer',
        utm_source: 'shefi',
        utm_campaign: 'partner-launch'
      }),
      expect.anything()
    )
  })

  it('should ignore a second click while a re-download is in flight', async () => {
    // First call resolves after a tick so the in-flight guard triggers on the second click.
    let resolveStream: (() => void) | undefined
    mockStreamOrFallback.mockImplementation(() => new Promise<{ bytesTransferred?: number }>(r => (resolveStream = () => r({}))))
    const { findByRole } = render(<DownloadSuccess />)
    const link = await findByRole('link')
    link.click()
    link.click()
    resolveStream?.()
    await waitFor(() => {
      expect(mockStreamOrFallback).toHaveBeenCalledTimes(1)
    })
  })

  it('should fire download_failed when the footer download throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { findByRole } = render(<DownloadSuccess />)
    // Wait for the auto-flow to complete its own _STARTED + _SUCCESS using the
    // default resolved mock, so the next mockRejectedValueOnce we set up only
    // affects the footer click — not the page-mount flow.
    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything())
    })
    mockCalculateDownloadUrl.mockRejectedValueOnce(new Error('boom'))

    const link = await findByRole('link')
    link.click()

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_failed',
        expect.objectContaining({
          place: 'download-success-footer',
          download_target: 'desktop_installer',
          utm_source: 'shefi',
          utm_campaign: 'partner-launch'
        }),
        expect.anything()
      )
    })
  })

  it('should fire footer download_failed via the built tracker when the stream itself throws', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { findByRole } = render(<DownloadSuccess />)
    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything())
    })
    // URL resolution succeeds for the footer too; stream rejects after the
    // tracker is built so the catch branch must reuse it (covers the
    // tracker.failed line, not the fallback tracker path).
    mockStreamOrFallback.mockRejectedValueOnce(new Error('footer stream blew up'))

    const link = await findByRole('link')
    link.click()

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_failed',
        expect.objectContaining({ place: 'download-success-footer', reason: 'footer stream blew up' }),
        expect.anything()
      )
    })
  })
})

describe('when DownloadSuccess mounts and the url resolution rejects', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=download-page&utm_source=shefi')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=download-page')
    mockCalculateDownloadUrl.mockRejectedValue(new Error('No download link available'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire download_failed with the CDN fallback href and the error reason (no downloadUrl in hand)', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_failed',
        expect.objectContaining({
          place: 'download-page',
          href: 'https://cdn.decentraland.org/launcher/Install-Decentraland.exe',
          os: 'Windows',
          arch: 'amd64',
          anon_user_id: 'anon-123',
          auth_state: 'anonymous',
          revisit: 0,
          reason: 'No download link available',
          // The fallback tracker must carry the same attribution as the main
          // one — otherwise every failed-on-mount download silently loses the
          // desktop_installer/utm tagging and skews per-campaign failure rates.
          download_target: 'desktop_installer',
          utm_source: 'shefi'
        }),
        expect.anything()
      )
    })
  })

  it('should capture the error in Sentry tagged with step calculate_url when no tracker was built', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => expect(findEventCall('download_failed')).toBeDefined())
    expect(mockCaptureDownloadError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ feature: 'download_funnel', step: 'calculate_url', os: 'Windows' })
    )
  })

  it('should capture the error in Sentry tagged with step stream when the stream throws after the tracker is built', async () => {
    mockCalculateDownloadUrl.mockReset()
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockReset()
    mockStreamOrFallback.mockRejectedValue(new Error('stream blew up'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DownloadSuccess />)

    await waitFor(() => expect(findEventCall('download_failed')).toBeDefined())
    expect(mockCaptureDownloadError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ feature: 'download_funnel', step: 'stream' })
    )
  })

  it('should fire download_failed via the built tracker when the stream itself throws (URL resolution succeeded)', async () => {
    // URL resolution succeeds, so the tracker is built and _STARTED fires;
    // then the stream rejects. The catch branch must reuse the built tracker
    // (NOT the fallback path) so the payload carries the resolved downloadUrl.
    mockCalculateDownloadUrl.mockReset()
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockReset()
    mockStreamOrFallback.mockRejectedValue(new Error('stream blew up'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith(
        'download_failed',
        expect.objectContaining({
          place: 'download-page',
          href: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
          reason: 'stream blew up'
        }),
        expect.anything()
      )
    })
    expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_started', expect.anything(), expect.anything())
  })

  it('should NOT fire download_started when URL resolution fails before the tracker is built', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_failed', expect.anything(), expect.anything())
    })

    expect(mockPostSegmentEvent).not.toHaveBeenCalledWith('download_started', expect.anything(), expect.anything())
  })
})

describe('when the same os/arch is revisited within the session', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1024 })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should report revisit=0 on the first mount and increment on subsequent mounts of the same os/arch', async () => {
    const { unmount } = render(<DownloadSuccess />)
    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_started', expect.objectContaining({ revisit: 0 }), expect.anything())
    })
    unmount()
    mockPostSegmentEvent.mockClear()

    render(<DownloadSuccess />)
    await waitFor(() => {
      expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_started', expect.objectContaining({ revisit: 1 }), expect.anything())
    })
  })

  it('should re-run the full download flow on every revisit (no idempotency bail)', async () => {
    const { unmount } = render(<DownloadSuccess />)
    await waitFor(() => {
      expect(mockStreamOrFallback).toHaveBeenCalledTimes(1)
    })
    unmount()

    render(<DownloadSuccess />)
    await waitFor(() => {
      expect(mockStreamOrFallback).toHaveBeenCalledTimes(2)
    })
  })
})

describe('when anon_user_id has not resolved yet at mount', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64')
    mockUseAnonUserId.mockReturnValue(undefined)
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1024 })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it('should wait for the anon id timeout before starting the download', async () => {
    render(<DownloadSuccess />)

    // Before the timeout elapses the download must not have started.
    expect(mockCalculateDownloadUrl).not.toHaveBeenCalled()

    // Flush the 800ms grace period; the download proceeds without an anon id.
    await React.act(async () => {
      jest.advanceTimersByTime(800)
    })

    expect(mockCalculateDownloadUrl).toHaveBeenCalled()
  })

  it('should clear the pending timeout on unmount before it fires', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout')
    const { unmount } = render(<DownloadSuccess />)
    unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})

describe('when the page unmounts mid-flight (abort handling)', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should bail out after url resolution when the request was aborted by an unmount', async () => {
    let resolveUrl: ((value: { url: string; filename: string }) => void) | undefined
    mockCalculateDownloadUrl.mockReturnValue(
      new Promise(resolve => {
        resolveUrl = resolve
      })
    )

    const { unmount } = render(<DownloadSuccess />)
    // Abort the in-flight request, then let url resolution settle.
    unmount()
    await React.act(async () => {
      resolveUrl?.({ url: 'https://cdn.decentraland.org/x.exe', filename: 'x.exe' })
      await Promise.resolve()
    })

    // Because the controller was aborted before resolution, the stream is never
    // requested and no success/started analytics fire post-abort.
    expect(mockStreamOrFallback).not.toHaveBeenCalled()
  })

  it('should not finalize the stream result when aborted mid-stream', async () => {
    mockCalculateDownloadUrl.mockResolvedValue({ url: 'https://cdn.decentraland.org/x.exe', filename: 'x.exe' })
    let resolveStream: ((value: { bytesTransferred: number }) => void) | undefined
    mockStreamOrFallback.mockReturnValue(
      new Promise(resolve => {
        resolveStream = resolve
      })
    )

    const { unmount } = render(<DownloadSuccess />)
    await waitFor(() => expect(mockStreamOrFallback).toHaveBeenCalled())

    unmount()
    await React.act(async () => {
      resolveStream?.({ bytesTransferred: 10 })
      await Promise.resolve()
    })

    // The post-abort success branch is skipped, so download_success never fires.
    expect(mockPostSegmentEvent).not.toHaveBeenCalledWith('download_success', expect.anything(), expect.anything())
  })
})

describe('when the user leaves the page (download_funnel_exit)', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1024 })
  })

  afterEach(() => {
    jest.resetAllMocks()
    setVisibility(false)
  })

  it('should fire the exit event when hidden, with the fired flags after a completed download', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything()))

    React.act(() => {
      setVisibility(true)
    })

    expect(mockSendDownloadFunnelExit).toHaveBeenCalledTimes(1)
    expect(mockSendDownloadFunnelExit).toHaveBeenCalledWith(
      expect.objectContaining({
        os: 'Windows',
        arch: 'amd64',
        place: 'landing-hero',
        startedFired: true,
        successFired: true,
        failedFired: false,
        anonUserId: 'anon-123',
        msOnPage: expect.any(Number)
      })
    )
  })

  it('should report startedFired=false when the user leaves before the download events fire', async () => {
    // Never resolves → download_started fires but success/failed do not before exit.
    mockCalculateDownloadUrl.mockReturnValue(new Promise(() => undefined))
    render(<DownloadSuccess />)

    React.act(() => {
      setVisibility(true)
    })

    expect(mockSendDownloadFunnelExit).toHaveBeenCalledWith(
      expect.objectContaining({ startedFired: false, successFired: false, failedFired: false })
    )
  })

  it('should fire again on a later hide (dedup handled in the warehouse)', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything()))

    React.act(() => {
      setVisibility(true) // switch away
      setVisibility(false) // come back
      setVisibility(true) // leave
    })

    expect(mockSendDownloadFunnelExit).toHaveBeenCalledTimes(2)
  })

  it('should NOT fire the exit event on a direct landing with no place (no download click)', async () => {
    // No `place` param → resolveDownloadPlace returns UNKNOWN → not a funnel session.
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64')
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64')
    render(<DownloadSuccess />)
    await waitFor(() => expect(mockPostSegmentEvent).toHaveBeenCalledWith('download_success', expect.anything(), expect.anything()))

    React.act(() => {
      setVisibility(true)
    })

    expect(mockSendDownloadFunnelExit).not.toHaveBeenCalled()
  })
})

describe('when a download click correlation exists in sessionStorage', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=windows&place=landing-hero')
    sessionStorage.setItem('downloadFunnel:lastClick', JSON.stringify({ click_id: 'click-abc', clicked_at: Date.now() - 500 }))
    mockCalculateDownloadUrl.mockResolvedValue({ url: 'https://gw/dl.exe', filename: 'dl.exe' })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1, deliveryMode: 'streamed', gatewayRequestId: 'req-xyz' })
  })

  afterEach(() => {
    sessionStorage.removeItem('downloadFunnel:lastClick')
    jest.resetAllMocks()
  })

  it('should attach click_id and ms_since_click to download_started', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(findEventCall('download_started')).toBeDefined())
    const [, payload] = findEventCall('download_started')!
    expect(payload).toEqual(expect.objectContaining({ click_id: 'click-abc', ms_since_click: expect.any(Number) }))
  })

  it('should attach click_id to the download_funnel_exit snapshot', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(findEventCall('download_started')).toBeDefined())
    setVisibility(true)
    expect(mockSendDownloadFunnelExit).toHaveBeenCalledWith(expect.objectContaining({ clickId: 'click-abc' }))
  })

  it('should forward click_id as a query param to the gateway download url', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(findEventCall('download_started')).toBeDefined())
    expect(mockAddQueryParams).toHaveBeenCalledWith('https://gw/dl.exe', expect.objectContaining({ click_id: 'click-abc' }))
  })

  it('should attach delivery_mode and gateway_request_id to download_success', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(findEventCall('download_success')).toBeDefined())
    const [, payload] = findEventCall('download_success')!
    expect(payload).toEqual(expect.objectContaining({ delivery_mode: 'streamed', gateway_request_id: 'req-xyz' }))
  })
})

describe('when the download stream resolves without a gateway request id (macOS / fallback)', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=macos&place=landing-hero')
    sessionStorage.clear()
    mockCalculateDownloadUrl.mockResolvedValue({ url: 'https://gw/dl.dmg', filename: 'dl.dmg' })
    mockStreamOrFallback.mockResolvedValue({ deliveryMode: 'anchor_native' })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should record delivery_mode but omit gateway_request_id on download_success', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(findEventCall('download_success')).toBeDefined())
    const [, payload] = findEventCall('download_success')!
    expect(payload).toEqual(expect.objectContaining({ delivery_mode: 'anchor_native' }))
    expect(payload).not.toHaveProperty('gateway_request_id')
  })
})

describe('when collectClientFingerprint throws', () => {
  // Regression guard for P2-4: a fingerprint failure used to be caught by a
  // try/catch that wrapped the ENTIRE buildTrackerExtra body, so it also
  // discarded the campaign params and (now) the click correlation. The fix
  // isolates the try/catch to only the collectClientFingerprint() call.
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero&utm_source=shefi&utm_campaign=partner-q3')
    sessionStorage.clear()
    sessionStorage.setItem('downloadFunnel:lastClick', JSON.stringify({ click_id: 'click-abc', clicked_at: Date.now() - 500 }))
    window.history.replaceState(
      {},
      '',
      '/download_success?os=Windows&arch=amd64&place=landing-hero&utm_source=shefi&utm_campaign=partner-q3'
    )
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1024 })
    mockCollectClientFingerprint.mockImplementation(() => {
      throw new Error('fingerprint blew up')
    })
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    sessionStorage.removeItem('downloadFunnel:lastClick')
    jest.resetAllMocks()
  })

  it('should still carry the utm_* params and click_id on download_started', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => expect(findEventCall('download_started')).toBeDefined())
    const [, payload] = findEventCall('download_started')!
    expect(payload).toEqual(
      expect.objectContaining({
        utm_source: 'shefi',
        utm_campaign: 'partner-q3',
        click_id: 'click-abc',
        download_target: 'desktop_installer'
      })
    )
    expect(payload).not.toHaveProperty('fp_screen_width')
  })
})

describe('when DownloadSuccess mounts', () => {
  beforeEach(() => {
    sessionStorage.clear()
    searchParamsInstance = new URLSearchParams('os=windows&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({ url: 'https://gw/dl.exe', filename: 'dl.exe' })
    mockStreamOrFallback.mockResolvedValue({ bytesTransferred: 1 })
  })

  afterEach(() => {
    sessionStorage.clear()
    jest.resetAllMocks()
  })

  it('should fire download_success_arrived immediately, before the download starts', () => {
    mockUseAnonUserId.mockReturnValue(undefined) // gate de 800ms sin resolver
    render(<DownloadSuccess />)
    const arrived = findEventCall('download_success_arrived')
    expect(arrived).toBeDefined()
    expect(arrived![1]).toEqual(
      expect.objectContaining({ os: 'Windows', arch: 'amd64', place: 'landing-hero', revisit: 0, auth_state: 'anonymous' })
    )
    expect(findEventCall('download_started')).toBeUndefined()
  })

  it('should keep place=unknown in the payload so direct landings are measurable', () => {
    searchParamsInstance = new URLSearchParams('os=windows')
    render(<DownloadSuccess />)
    expect(findEventCall('download_success_arrived')![1]).toEqual(expect.objectContaining({ place: 'unknown' }))
  })

  it('should fire arrived exactly once per mount', async () => {
    render(<DownloadSuccess />)
    await waitFor(() => expect(findEventCall('download_started')).toBeDefined())
    const arrivedCalls = mockPostSegmentEvent.mock.calls.filter(([event]) => event === 'download_success_arrived')
    expect(arrivedCalls).toHaveLength(1)
  })
})

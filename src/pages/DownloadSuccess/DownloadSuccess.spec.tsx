import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { DownloadSuccess } from './DownloadSuccess'

const mockTrack = jest.fn()
const mockCalculateDownloadUrl = jest.fn()
const mockTriggerFileDownload = jest.fn()
const mockDownloadFileWithProgress = jest.fn()
let searchParamsInstance = new URLSearchParams()
// Mutable so individual tests can flip the auth state used by the component.
let mockHasValidIdentity = false
// Mutable so tests can simulate Segment finishing its lazy init mid-flight.
let analyticsIsInitialized = true

jest.mock('decentraland-ui2', () => ({
  Logo: () => null,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}))

jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ isInitialized: analyticsIsInitialized, track: mockTrack }),
  useTranslation: () => ({
    intl: { formatMessage: ({ id }: { id: string }) => id }
  })
}))

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParamsInstance, jest.fn()]
}))

jest.mock('../../hooks/useAnonUserId', () => ({
  ANON_USER_ID_PARAM: 'anonUserId',
  useAnonUserId: () => 'anon-123'
}))

jest.mock('../../hooks/useGetIdentityId', () => ({
  useGetIdentityId: () => () => Promise.resolve('id-xyz')
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: mockHasValidIdentity, address: undefined })
}))

jest.mock('../../modules/downloadWithIdentity', () => ({
  calculateDownloadUrl: (...args: unknown[]) => mockCalculateDownloadUrl(...args)
}))

jest.mock('../../modules/file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args),
  downloadFileWithProgress: (...args: unknown[]) => mockDownloadFileWithProgress(...args)
}))

jest.mock('../../modules/url', () => ({
  FALLBACK_CDN_RELEASE_LINKS: {
    Windows: { amd64: 'https://cdn.decentraland.org/launcher/Install-Decentraland.exe' },
    macOS: { arm64: 'https://cdn.decentraland.org/launcher/Decentraland-arm64.dmg' }
  },
  addQueryParamsToUrlString: (url: string) => url
}))

jest.mock('./DownloadSuccessLayout', () => ({
  DownloadSuccessLayout: () => <div data-testid="layout" />
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

describe('when DownloadSuccess mounts with os, place, and a successful url resolution', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockDownloadFileWithProgress.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire download_started with place and the fallback href', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('download_started', {
        place: 'landing-hero',
        href: 'https://cdn.decentraland.org/launcher/Install-Decentraland.exe',

        auth_state: 'anonymous'
      })
    })
  })

  it('should fire download_success with place, the resolved href, and filename', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('download_success', {
        place: 'landing-hero',
        href: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
        filename: 'Install-Decentraland.exe',

        auth_state: 'anonymous'
      })
    })
  })

  it('should report auth_state="authenticated" when there is a valid identity in localStorage', async () => {
    mockHasValidIdentity = true
    try {
      render(<DownloadSuccess />)
      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith('download_started', expect.objectContaining({ auth_state: 'authenticated' }))
        expect(mockTrack).toHaveBeenCalledWith('download_success', expect.objectContaining({ auth_state: 'authenticated' }))
      })
    } finally {
      mockHasValidIdentity = false
    }
  })
})

describe('when DownloadSuccess re-mounts (refresh) within the rate-limit window', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockDownloadFileWithProgress.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should not re-hit the gateway when an in-flight lock is still fresh', async () => {
    // Simulate a previous mount that acquired the lock and left without releasing it
    // (e.g. tab killed by refresh while the streaming fetch was still in flight).
    sessionStorage.setItem('downloadSuccess:triggered:Windows:amd64', String(Date.now()))

    render(<DownloadSuccess />)
    // Give the effect time to run; if the lock works, downloadFileWithProgress never fires.
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(mockDownloadFileWithProgress).not.toHaveBeenCalled()
  })

  it('should re-download once the lock is older than the rate-limit ttl', async () => {
    // Pretend the previous attempt happened ~31 s ago — older than the 30 s TTL.
    sessionStorage.setItem('downloadSuccess:triggered:Windows:amd64', String(Date.now() - 31_000))

    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockDownloadFileWithProgress).toHaveBeenCalledTimes(1)
    })
  })

  it('should release the lock after a successful download so refresh re-downloads', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('download_success', expect.anything())
    })

    expect(sessionStorage.getItem('downloadSuccess:triggered:Windows:amd64')).toBeNull()
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire download_started with place set to unknown', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('download_started', expect.objectContaining({ place: 'unknown' }))
    })
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should coerce place to unknown so analytics cardinality stays bounded', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('download_started', expect.objectContaining({ place: 'unknown' }))
    })
  })
})

describe('when Segment has not finished lazy-loading at mount (race condition)', () => {
  // Regression guard for the bug surfaced by the anonymous Download First flow:
  // calculateDownloadUrl resolves in ~1ms for unauthenticated users (no
  // /identities API call), so the previous race-fix that relied on the await
  // as an implicit Segment-load barrier no longer works. The component must
  // explicitly wait for analytics readiness before tracking, otherwise
  // download_started and download_success silently drop into the void.
  //
  // Asserting the "no fire while uninitialized" half here. The "fires once
  // Segment is ready" half is implicitly covered by every other test in
  // this file (they all run with analyticsIsInitialized = true).

  beforeEach(() => {
    analyticsIsInitialized = false
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockDownloadFileWithProgress.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
    analyticsIsInitialized = true
  })

  it('should trigger the download immediately but hold the analytics events while Segment is loading', async () => {
    render(<DownloadSuccess />)

    // The download itself is triggered without waiting for Segment — UX must
    // not be gated on third-party script load.
    await waitFor(() => {
      expect(mockDownloadFileWithProgress).toHaveBeenCalled()
    })

    // While analytics is still loading, neither event has fired.
    expect(mockTrack).not.toHaveBeenCalledWith('download_started', expect.anything())
    expect(mockTrack).not.toHaveBeenCalledWith('download_success', expect.anything())
  })
})

describe('when the streamed download fails (e.g. CORS not configured on the gateway)', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=landing-hero')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=landing-hero')
    mockCalculateDownloadUrl.mockResolvedValue({
      url: 'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
      filename: 'Install-Decentraland.exe'
    })
    mockDownloadFileWithProgress.mockRejectedValue(new TypeError('Failed to fetch'))
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fall back to triggerFileDownload so the file still downloads', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTriggerFileDownload).toHaveBeenCalledWith(
        'https://cdn.decentraland.org/launcher/signed/Install-Decentraland.exe?sig=abc',
        'Install-Decentraland.exe'
      )
    })
  })

  it('should still fire download_success after the fallback', async () => {
    render(<DownloadSuccess />)

    // The fallback path holds the loader visible with a 4 s grace window so
    // CORS-blocked previews still feel responsive while the gateway processes
    // the native-anchor download. Allow waitFor to span that window.
    await waitFor(
      () => {
        expect(mockTrack).toHaveBeenCalledWith('download_success', expect.objectContaining({ place: 'landing-hero' }))
      },
      { timeout: 6000 }
    )
  })
})

describe('when DownloadSuccess mounts and the url resolution rejects', () => {
  beforeEach(() => {
    searchParamsInstance = new URLSearchParams('os=Windows&arch=amd64&place=download-page')
    sessionStorage.clear()
    window.history.replaceState({}, '', '/download_success?os=Windows&arch=amd64&place=download-page')
    mockCalculateDownloadUrl.mockRejectedValue(new Error('No download link available'))
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire download_failed with place and the fallback href', async () => {
    render(<DownloadSuccess />)

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith('download_failed', {
        place: 'download-page',
        href: 'https://cdn.decentraland.org/launcher/Install-Decentraland.exe',

        auth_state: 'anonymous'
      })
    })
  })
})

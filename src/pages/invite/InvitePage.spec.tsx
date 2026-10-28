import { render, waitFor } from '@testing-library/react'
import { REFERRER_STORAGE_KEY } from '../../utils/referrer'
import { InvitePage } from './InvitePage'

const mockUseParams = jest.fn()
const mockInviteHero = jest.fn()
const mockFetch = jest.fn()
const mockPage = jest.fn()
const mockUseInviteDirectDownload = jest.fn()
let mockIsAnalyticsInitialized = true
const INVITE_PATHNAME = '/invite/Brai'

jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useLocation: () => ({ pathname: INVITE_PATHNAME })
}))

jest.mock('decentraland-ui2', () => ({
  useDesktopMediaQuery: () => false
}))

jest.mock('@dcl/hooks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  return {
    useTranslation: () => ({
      t: (id: string, values?: Record<string, unknown>) => (values ? `${id}:${Object.values(values).join(',')}` : id)
    }),
    useAnalytics: () => ({ isInitialized: mockIsAnalyticsInitialized, page: mockPage }),
    useAsyncMemo: <T,>(factory: () => Promise<T>, deps: unknown[]) => {
      const [state, setState] = ReactLib.useState<{ value: T | null; loading: boolean }>({ value: null, loading: true })
      ReactLib.useEffect(() => {
        let cancelled = false
        factory().then(value => {
          if (!cancelled) setState({ value, loading: false })
        })
        return () => {
          cancelled = true
        }
      }, deps)
      return [state.value, { loading: state.loading }] as const
    }
  }
})

jest.mock('@dcl/schemas/dist/misc', () => ({
  EthAddress: {
    validate: (v: string) => /^0x[0-9a-fA-F]{40}$/.test(v)
  }
}))

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://peer.example.com'
}))

jest.mock('../../components/Invite/InviteHero/InviteHero', () => ({
  InviteHero: (props: Record<string, unknown>) => {
    mockInviteHero(props)
    return <div data-testid="invite-hero" />
  }
}))

jest.mock('../../components/Invite/InviteFaqs/InviteFaqs', () => ({
  InviteFaqs: () => <div data-testid="invite-faqs" />
}))

jest.mock('../../components/LandingFooter', () => ({
  LandingFooter: () => <div data-testid="landing-footer" />
}))

jest.mock('../../data/inviteContent', () => ({
  INVITE_HERO_MEDIA: {},
  INVITE_SECOND_HERO_MEDIA: {}
}))

jest.mock('../../features/invite/invite.flags', () => ({
  useInviteDirectDownload: () => mockUseInviteDirectDownload()
}))

const referrerProfile = {
  avatars: [{ ethAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', name: 'SirTesla' }]
}

// Save and restore the original `global.fetch` once per file. The previous
// per-describe `global.fetch = mockFetch` assignments did not restore, so a
// throw in any test would leak the stub into the next file.
const originalFetch = global.fetch
beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch
})
afterAll(() => {
  global.fetch = originalFetch
})

// Reset the analytics-initialized flag before every test so a test that flips it
// false doesn't leak into the next one.
beforeEach(() => {
  mockIsAnalyticsInitialized = true
})

describe('when the referrer param is a Decentraland name', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: 'Brai' })
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/names/Brai/owner')) {
        return Promise.resolve({ json: () => Promise.resolve({ owner: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' }) })
      }
      if (url.includes('/lambdas/profiles/0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd')) {
        return Promise.resolve({ json: () => Promise.resolve(referrerProfile) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should resolve the name through /lambdas/names/{name}/owner', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('https://peer.example.com/lambdas/names/Brai/owner', expect.any(Object))
    })
  })

  it('should pass the resolved profile to InviteHero so the inviter name renders', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ referrer: referrerProfile, isLoading: false }))
    })
  })

  it('should pass the lowercased resolved address to InviteHero', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalledWith(
        expect.objectContaining({ referrerAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', isLoading: false })
      )
    })
  })

  it('should not call the legacy /lambdas/users/{id}/names endpoint', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
    const calledUrls = mockFetch.mock.calls.map(([url]) => url as string)
    expect(calledUrls.some(url => url.includes('/lambdas/users/'))).toBe(false)
  })
})

describe('when the referrer param is already an Ethereum address', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' })
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/profiles/0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd')) {
        return Promise.resolve({ json: () => Promise.resolve(referrerProfile) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should skip name resolution and fetch the profile directly', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://peer.example.com/lambdas/profiles/0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
        expect.any(Object)
      )
    })
    const calledUrls = mockFetch.mock.calls.map(([url]) => url as string)
    expect(calledUrls.some(url => url.includes('/lambdas/names/'))).toBe(false)
  })
})

describe('when the profile lookup is still in flight', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' })
    // Never resolves: reproduces a slow/hanging catalyst.
    mockFetch.mockImplementation(() => new Promise(() => {}))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should still expose the referrer address and unblock the CTA', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalledWith(
        expect.objectContaining({
          referrerAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd',
          isReferrerResolving: false
        })
      )
    })
  })
})

describe('when the name lookup fails', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: 'Unknown' })
    mockFetch.mockRejectedValue(new Error('network'))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should keep the inviter referrer prop null', async () => {
    render(<InvitePage />)
    await waitFor(() => expect(mockInviteHero).toHaveBeenCalled())
    expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ referrer: null }))
  })
})

describe('when the profile fetch fails after a successful name resolution', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: 'Brai' })
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/names/Brai/owner')) {
        return Promise.resolve({ json: () => Promise.resolve({ owner: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' }) })
      }
      return Promise.reject(new Error('profile down'))
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should set referrer to null', async () => {
    render(<InvitePage />)
    await waitFor(() => {
      const calls = mockFetch.mock.calls.map(c => String(c[0]))
      expect(calls.some(u => u.includes('/lambdas/profiles/'))).toBe(true)
    })
    expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ referrer: null }))
  })

  it('should keep the resolved address so the referral is still attributed', async () => {
    render(<InvitePage />)
    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false }))
    })
    expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ referrerAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd' }))
  })
})

describe('when the referrer address has no deployed profile', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' })
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ error: 'Not Found', message: 'Profile not found' }) })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should still pass the address from the URL to InviteHero', async () => {
    render(<InvitePage />)
    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false }))
    })
    expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ referrerAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd' }))
  })
})

describe('when the referrer cannot be resolved at all', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: 'Unknown' })
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({}) })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should pass a null address and skip the profile lookup', async () => {
    render(<InvitePage />)
    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false }))
    })
    expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ referrerAddress: null }))
    const calledUrls = mockFetch.mock.calls.map(([url]) => url as string)
    expect(calledUrls.some(url => url.includes('/lambdas/profiles/'))).toBe(false)
  })
})

describe('when the referrer is empty', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: '' })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should skip the lookup entirely', async () => {
    render(<InvitePage />)
    await waitFor(() => expect(mockInviteHero).toHaveBeenCalled())
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('when tracking the invite pageview', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: 'Brai' })
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(null) })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fire a page() event for the invite path once analytics is initialized', async () => {
    render(<InvitePage />)

    await waitFor(() => expect(mockPage).toHaveBeenCalledWith(INVITE_PATHNAME))
    expect(mockPage).toHaveBeenCalledTimes(1)
  })

  it('should not fire page() before analytics is initialized', async () => {
    mockIsAnalyticsInitialized = false
    render(<InvitePage />)

    await waitFor(() => expect(mockInviteHero).toHaveBeenCalled())
    expect(mockPage).not.toHaveBeenCalled()
  })
})

describe('when the document head already has meta tags', () => {
  const addMeta = (attr: 'name' | 'property', key: string, content: string) => {
    const meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
    return meta
  }
  let metaEls: HTMLMetaElement[] = []

  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: '' })
    metaEls = [
      addMeta('name', 'description', 'orig-desc'),
      addMeta('property', 'og:title', 'orig-og-title'),
      addMeta('property', 'og:description', 'orig-og-desc')
    ]
  })

  afterEach(() => {
    metaEls.forEach(el => el.remove())
    metaEls = []
    jest.resetAllMocks()
  })

  it('should set the invite description on mount and restore the original on unmount', async () => {
    const { unmount } = render(<InvitePage />)
    await waitFor(() => expect(mockInviteHero).toHaveBeenCalled())

    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('page_invite.social.description')

    unmount()

    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('orig-desc')
  })

  it('should leave the Open Graph tags to the edge worker', async () => {
    const { unmount } = render(<InvitePage />)
    await waitFor(() => expect(mockInviteHero).toHaveBeenCalled())

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('orig-og-title')
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('orig-og-desc')

    unmount()
  })

  it('should fall back to the generic title while no inviter is resolved', async () => {
    render(<InvitePage />)
    await waitFor(() => expect(mockInviteHero).toHaveBeenCalled())

    expect(document.title).toBe('page_invite.social.title')
  })
})

describe('when the inviter profile resolves', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ referrer: 'Brai' })
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/names/Brai/owner')) {
        return Promise.resolve({ json: () => Promise.resolve({ owner: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' }) })
      }
      if (url.includes('/lambdas/profiles/')) {
        return Promise.resolve({ json: () => Promise.resolve(referrerProfile) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should name the inviter in the document title', async () => {
    render(<InvitePage />)

    await waitFor(() => expect(document.title).toBe('page_invite.social.title_with_name:SirTesla'))
  })

  it('should fall back to the generic title when the profile carries no name', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/names/Brai/owner')) {
        return Promise.resolve({ json: () => Promise.resolve({ owner: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' }) })
      }
      if (url.includes('/lambdas/profiles/')) {
        return Promise.resolve({ json: () => Promise.resolve({ avatars: [{ ethAddress: '0xd9b9', name: '  ' }] }) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })

    render(<InvitePage />)

    await waitFor(() => expect(mockInviteHero).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false })))
    expect(document.title).toBe('page_invite.social.title')
  })
})

describe('when the direct download flag is enabled', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    mockUseInviteDirectDownload.mockReturnValue(true)
    mockUseParams.mockReturnValue({ referrer: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' })
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/profiles/')) {
        return Promise.resolve({ json: () => Promise.resolve(referrerProfile) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    window.sessionStorage.clear()
  })

  it('should persist the resolved referrer for the download flow', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(window.sessionStorage.getItem(REFERRER_STORAGE_KEY)).toBe('0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd')
    })
  })
})

describe('when the direct download flag is disabled', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.sessionStorage.setItem(REFERRER_STORAGE_KEY, '0x1111111111111111111111111111111111111111')
    mockUseInviteDirectDownload.mockReturnValue(false)
    mockUseParams.mockReturnValue({ referrer: '0xD9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd' })
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/lambdas/profiles/')) {
        return Promise.resolve({ json: () => Promise.resolve(referrerProfile) })
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
    window.sessionStorage.clear()
  })

  it('should not persist the referrer and should clear any previously stored one', async () => {
    render(<InvitePage />)

    await waitFor(() => {
      expect(mockInviteHero).toHaveBeenCalled()
    })
    expect(window.sessionStorage.getItem(REFERRER_STORAGE_KEY)).toBeNull()
  })
})

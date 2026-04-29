import { render, waitFor } from '@testing-library/react'
import { InvitePage } from './InvitePage'

const mockUseParams = jest.fn()
const mockInviteHero = jest.fn()
const mockFetch = jest.fn()

jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams()
}))

jest.mock('decentraland-ui2', () => ({
  useDesktopMediaQuery: () => false
}))

jest.mock('@dcl/hooks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  return {
    useTranslation: () => ({ t: (id: string) => id }),
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

if (typeof AbortSignal.timeout !== 'function') {
  ;(AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = () => new AbortController().signal
}

const referrerProfile = {
  avatars: [{ ethAddress: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd', name: 'SirTesla' }]
}

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
    global.fetch = mockFetch as unknown as typeof fetch
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
    global.fetch = mockFetch as unknown as typeof fetch
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

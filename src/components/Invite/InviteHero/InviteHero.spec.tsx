import { act, render, screen } from '@testing-library/react'
import { InviteHero } from './InviteHero'
import type { InviteHeroProps } from './InviteHero.types'

const mockTrackClick = jest.fn()
const mockUseReferralUrl = jest.fn()

jest.mock('decentraland-ui2', () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />
}))

jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
}))

jest.mock('../../../hooks/contentful', () => ({
  useVideoOptimization: () => undefined
}))

jest.mock('../../../hooks/useFeatureFlagContext', () => ({
  useFeatureFlagContext: () => [{}, { loading: false }]
}))

jest.mock('../../../hooks/useReferralUrl', () => ({
  useReferralUrl: (referrer?: string) => mockUseReferralUrl(referrer)
}))

jest.mock('../../../images/referral-envelope.webp', () => 'envelope.webp')

// The real module ships untranspiled ESM, which Jest can't parse through the
// lazy() import.
jest.mock('decentraland-ui2/dist/components/WearablePreview/WearablePreview', () => ({
  WearablePreview: ({ profile }: { profile?: string }) => <div data-testid="wearable-preview" data-profile={profile ?? ''} />
}))

jest.mock('./InviteHero.styled', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react') as typeof import('react')
  const passthrough =
    (tag: string) =>
    ({ children, ...rest }: { children?: React.ReactNode }) =>
      React.createElement(tag, rest, children)
  return {
    AvatarContainer: passthrough('div'),
    AvatarWrapper: passthrough('div'),
    EnvelopeImage: passthrough('img'),
    EnvelopeImageContainer: passthrough('div'),
    EnvelopeShadow: passthrough('div'),
    GradientText: passthrough('span'),
    HeroActionsContainer: passthrough('div'),
    HeroContainer: passthrough('div'),
    HeroContent: passthrough('div'),
    HeroOverlayVideo: passthrough('div'),
    HeroSection: passthrough('section'),
    HeroSubTitle: passthrough('p'),
    HeroTextContainer: passthrough('div'),
    HeroTextWrapper: passthrough('div'),
    HeroTitle: passthrough('h1'),
    HeroVideo: passthrough('video')
  }
})

jest.mock('../../Buttons/BannerButton', () => ({
  BannerButton: ({ href, onClick, label }: { href: string; onClick: (e: unknown) => void; label: string }) => (
    <a href={href} onClick={onClick}>
      {label}
    </a>
  )
}))

const REFERRER_ADDRESS = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'
const URL_WITH_REFERRER = `https://decentraland.org/auth/login?referrer=${REFERRER_ADDRESS}&redirectTo=%2Fdownload`
const URL_WITHOUT_REFERRER = 'https://decentraland.org/auth/login?redirectTo=%2Fdownload'

const baseProps: InviteHeroProps = {
  title: 'Join Decentraland',
  subtitle: 'Come hang out',
  buttonLabel: 'Jump in',
  media: {} as InviteHeroProps['media'],
  eventPlace: 'invite_first_hero',
  referrer: null,
  referrerAddress: null,
  isDesktop: true
}

const originalLocation = window.location

const renderHero = (props: Partial<InviteHeroProps> = {}) => render(<InviteHero {...baseProps} {...props} />)

const clickCta = () => {
  act(() => {
    screen.getByRole('link', { name: 'Jump in' }).click()
  })
}

beforeEach(() => {
  jest.useFakeTimers()
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, href: 'https://decentraland.org/invite/brai' }
  })
  mockUseReferralUrl.mockImplementation((referrer?: string) => (referrer ? URL_WITH_REFERRER : URL_WITHOUT_REFERRER))
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
  Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  jest.resetAllMocks()
})

describe('when the referrer address is already resolved', () => {
  it('should build the referral URL from the address prop', () => {
    renderHero({ referrerAddress: REFERRER_ADDRESS, isLoading: false })

    expect(mockUseReferralUrl).toHaveBeenCalledWith(REFERRER_ADDRESS)
    expect(screen.getByRole('link', { name: 'Jump in' })).toHaveAttribute('href', URL_WITH_REFERRER)
  })

  it('should track the click and navigate with the referrer attached', () => {
    renderHero({ referrerAddress: REFERRER_ADDRESS, isLoading: false })

    clickCta()

    expect(mockTrackClick).toHaveBeenCalledTimes(1)
    expect(window.location.href).not.toBe(URL_WITH_REFERRER)

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(window.location.href).toBe(URL_WITH_REFERRER)
  })

  it('should not schedule a second navigation if the component re-renders after leaving', () => {
    const { rerender } = renderHero({ referrerAddress: REFERRER_ADDRESS, isLoading: false })

    clickCta()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(window.location.href).toBe(URL_WITH_REFERRER)

    // A late render (e.g. the loading flag flipping while the page unloads)
    // must not re-enter the deferred navigation.
    mockUseReferralUrl.mockReturnValue('https://decentraland.org/auth/login?referrer=late')
    rerender(<InviteHero {...baseProps} referrerAddress={REFERRER_ADDRESS} isLoading={true} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(window.location.href).toBe(URL_WITH_REFERRER)
  })
})

describe('when the visitor clicks while the referrer is still resolving', () => {
  it('should not navigate before the referrer resolves', () => {
    renderHero({ referrerAddress: null, isLoading: true })

    clickCta()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(window.location.href).toBe('https://decentraland.org/invite/brai')
  })

  it('should navigate with the referrer once it resolves', () => {
    const { rerender } = renderHero({ referrerAddress: null, isLoading: true })

    clickCta()

    act(() => {
      jest.advanceTimersByTime(200)
    })

    rerender(<InviteHero {...baseProps} referrerAddress={REFERRER_ADDRESS} isLoading={false} />)

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(window.location.href).toBe(URL_WITH_REFERRER)
  })

  it('should give up and navigate unattributed once the wait budget expires', () => {
    renderHero({ referrerAddress: null, isLoading: true })

    clickCta()

    act(() => {
      jest.advanceTimersByTime(1200)
    })

    expect(window.location.href).toBe(URL_WITHOUT_REFERRER)
  })
})

describe('when the referrer profile resolved with a name', () => {
  const referrer = { avatars: [{ ethAddress: REFERRER_ADDRESS, name: 'SirTesla' }] } as unknown as InviteHeroProps['referrer']

  it('should render the inviter name on the primary hero', () => {
    renderHero({ referrer, referrerAddress: REFERRER_ADDRESS, isLoading: false })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SirTesla')
  })

  it('should not render the inviter name on the secondary hero', () => {
    renderHero({ referrer, referrerAddress: REFERRER_ADDRESS, isLoading: false, isSecondaryHero: true })

    expect(screen.queryByText(/SirTesla/)).toBeNull()
  })
})

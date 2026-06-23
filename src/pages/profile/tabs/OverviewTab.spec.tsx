import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { OverviewTab } from './OverviewTab'

// MUI icon default exports don't interop cleanly under this jest transform
// (they resolve to the module namespace object, not a component). Mock the ones
// OverviewTab renders so the info-field and link sections can mount.
jest.mock('@mui/icons-material/AlternateEmailRounded', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/CakeRounded', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/FavoriteBorderRounded', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/InsertLink', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/Public', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/PublicRounded', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/SportsEsportsOutlined', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/TransgenderRounded', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/TranslateRounded', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))
jest.mock('@mui/icons-material/Verified', () => ({ __esModule: true, default: () => mockReact.createElement('span') }))

const useGetProfileQueryMock = jest.fn()
const useTabletAndBelowMediaQueryMock = jest.fn()

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: (address: string | undefined) => useGetProfileQueryMock(address)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...rest }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) =>
    mockReact.createElement('div', rest, children),
  Button: ({ children, ...rest }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLButtonElement>) =>
    mockReact.createElement('button', rest, children),
  CatalogCard: ({
    asset,
    imageSrc,
    bottomAction,
    price
  }: {
    asset: { name: string }
    imageSrc: string
    bottomAction?: React.ReactNode
    price?: string
  }) =>
    mockReact.createElement(
      'div',
      { 'data-testid': 'equipped-card', 'data-name': asset?.name, 'data-image': imageSrc, 'data-price': price ?? '' },
      bottomAction
    ),
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Tooltip: ({ children, title }: { children: React.ReactElement; title?: React.ReactNode }) =>
    mockReact.createElement(mockReact.Fragment, null, children, title),
  Typography: ({ children }: { children: React.ReactNode }) => mockReact.createElement('p', null, children),
  useTabletAndBelowMediaQuery: () => useTabletAndBelowMediaQueryMock(),
  styled: () => (component: unknown) => component
}))

jest.mock('./OverviewTab.creator', () => ({
  CreatorByLine: () => null
}))

jest.mock('../../../components/profile/EditProfileButton', () => ({
  EditProfileButton: () => mockReact.createElement('button', { 'data-testid': 'edit-profile-button' })
}))

jest.mock('../../../config/env', () => ({
  getEnv: () => 'https://peer.test'
}))

const useProfileBadgesMock = jest.fn((_address?: string) => ({ badges: [] as unknown[], isLoading: false }))
jest.mock('../../../features/profile/profile.badges.client', () => ({
  useProfileBadges: (address: string | undefined) => useProfileBadgesMock(address)
}))

const useEquippedCollectiblesMock = jest.fn(() => ({ collectibles: [] as unknown[], isLoading: false }))
jest.mock('../../../features/profile/profile.wearables.client', () => ({
  useEquippedCollectibles: () => useEquippedCollectiblesMock()
}))

jest.mock('./OverviewTab.icons', () => ({
  PronounsIcon: () => mockReact.createElement('span', { 'data-testid': 'pronouns-icon' }),
  WearableInfoBadges: () => mockReact.createElement('span', { 'data-testid': 'wearable-info-badges' })
}))

jest.mock('./OverviewTab.styled', () => {
  const make = (testid: string, tag: string = 'div') =>
    mockReact.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { $bg?: string }>(({ $bg: _bg, ...props }, ref) =>
      mockReact.createElement(tag, { 'data-testid': testid, ref, ...props })
    )
  return {
    BadgeFallback: make('badge-fallback'),
    BadgeImage: make('badge-image', 'img'),
    BadgeSlot: make('badge-slot'),
    BadgesRow: make('badges-row'),
    BioText: make('bio-text', 'p'),
    EditIconButton: make('edit-icon-button', 'button'),
    EmptyBio: make('empty-bio', 'p'),
    EquippedCardLink: make('equipped-card-link', 'a'),
    EquippedGrid: make('equipped-grid'),
    InfoGrid: make('info-grid'),
    InfoIcon: make('info-icon', 'span'),
    InfoItem: make('info-item'),
    InfoLabel: make('info-label', 'span'),
    InfoSurface: make('info-surface'),
    InfoValue: make('info-value', 'span'),
    LinkPill: make('link-pill', 'a'),
    LinkPillIcon: make('link-pill-icon', 'span'),
    LinksRow: make('links-row'),
    LoadingRow: make('loading-row'),
    NameCtaButton: make('name-cta-button', 'button'),
    OverviewRoot: make('overview-root'),
    OwnerCtaRow: make('owner-cta-row'),
    SectionHeader: make('section-header'),
    SectionTitle: make('section-title', 'h3')
  }
})

function renderOverview(props: { address: string; isOwnProfile: boolean } = { address: '0xabc', isOwnProfile: false }) {
  return render(<OverviewTab {...props} />)
}

describe('OverviewTab', () => {
  beforeEach(() => {
    // Default to desktop; the mobile-only name CTA row is asserted explicitly below.
    useTabletAndBelowMediaQueryMock.mockReturnValue(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the profile is loading', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: null, isLoading: true })
    })

    it('should render a single loading spinner before sections render', () => {
      renderOverview()
      expect(screen.getAllByRole('progressbar')).toHaveLength(1)
    })
  })

  describe('when the profile is loaded with bio and wearables', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({
        data: {
          avatars: [
            {
              name: 'Brai',
              description: 'A tester from Decentraland',
              hasClaimedName: true,
              avatar: { wearables: ['urn:decentraland:matic:collections-v2:0xabc:42', 'urn:decentraland:matic:collections-v2:0xdef:7'] }
            }
          ]
        },
        isLoading: false
      })
    })

    it('should render the bio text', () => {
      renderOverview()
      expect(screen.getByText('A tester from Decentraland')).toBeInTheDocument()
    })

    it('should not render equipped cards when no collectibles are returned (base avatars filtered out)', () => {
      renderOverview()
      expect(screen.queryAllByTestId('equipped-card')).toHaveLength(0)
    })

    it('should render the empty-badges message when no badges are returned', () => {
      renderOverview()
      expect(screen.getByText('profile.overview.no_badges_yet')).toBeInTheDocument()
    })
  })

  describe('when the address has no Catalyst profile', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [] }, isLoading: false })
    })

    it('should not fetch badges (passes undefined) so a naked avatar is not decorated with false badges', () => {
      renderOverview({ address: '0xabc', isOwnProfile: false })
      expect(useProfileBadgesMock).toHaveBeenCalledWith(undefined)
    })

    it('should render the empty-badges message rather than any badge', () => {
      renderOverview({ address: '0xabc', isOwnProfile: false })
      expect(screen.getByText('profile.overview.no_badges_yet')).toBeInTheDocument()
    })
  })

  describe('when a real profile exists', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai' }] }, isLoading: false })
    })

    it('should fetch badges for the resolved address', () => {
      renderOverview({ address: '0xabc', isOwnProfile: false })
      expect(useProfileBadgesMock).toHaveBeenCalledWith('0xabc')
    })
  })

  describe('when the profile has no bio', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({
        data: { avatars: [{ name: 'Anon', hasClaimedName: false }] },
        isLoading: false
      })
    })

    it('should show the prompt for the owner to add a bio', () => {
      renderOverview({ address: '0xabc', isOwnProfile: true })
      expect(screen.getByText('profile.overview.no_bio_owner')).toBeInTheDocument()
    })

    it('should show the no-bio message for a Member viewer', () => {
      renderOverview({ address: '0xabc', isOwnProfile: false })
      expect(screen.getByText('profile.overview.no_bio_member')).toBeInTheDocument()
    })
  })

  describe('when rendering the edit CTA', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({
        data: { avatars: [{ name: 'Brai', hasClaimedName: true }] },
        isLoading: false
      })
    })

    it('should render it inside the info card on the own profile', () => {
      renderOverview({ address: '0xabc', isOwnProfile: true })

      const infoSurfaces = screen.getAllByTestId('info-surface')
      expect(infoSurfaces[0]).toContainElement(screen.getByTestId('edit-profile-button'))
    })

    it('should not render it on a member profile', () => {
      renderOverview({ address: '0xabc', isOwnProfile: false })

      expect(screen.queryByTestId('edit-profile-button')).not.toBeInTheDocument()
    })
  })

  // On mobile the profile header is absent, so the own-profile name CTA renders in the
  // Overview action row (Figma 322:49226) — this is the missing-button bug.
  describe('when rendering the own-profile name CTA on mobile', () => {
    beforeEach(() => {
      useTabletAndBelowMediaQueryMock.mockReturnValue(true)
    })

    it('should show the get-a-unique-name CTA when the name is not claimed', () => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Anon', hasClaimedName: false }] }, isLoading: false })
      renderOverview({ address: '0xabc', isOwnProfile: true })

      expect(screen.getByText('profile.header.get_a_name')).toBeInTheDocument()
      expect(screen.queryByText('profile.header.manage_world')).not.toBeInTheDocument()
    })

    it('should show the manage-world CTA when the name is claimed', () => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai', hasClaimedName: true }] }, isLoading: false })
      renderOverview({ address: '0xabc', isOwnProfile: true })

      expect(screen.getByText('profile.header.manage_world')).toBeInTheDocument()
      expect(screen.queryByText('profile.header.get_a_name')).not.toBeInTheDocument()
    })

    it('should not render the name CTA on a member profile', () => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Anon', hasClaimedName: false }] }, isLoading: false })
      renderOverview({ address: '0xabc', isOwnProfile: false })

      expect(screen.queryByText('profile.header.get_a_name')).not.toBeInTheDocument()
    })

    it('should open the builder names page when the get-a-name CTA is clicked', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Anon', hasClaimedName: false }] }, isLoading: false })
      renderOverview({ address: '0xabc', isOwnProfile: true })

      fireEvent.click(screen.getByText('profile.header.get_a_name'))
      expect(openSpy).toHaveBeenCalledWith('https://peer.test/names', '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })

    it('should open the builder worlds page when the manage-world CTA is clicked', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai', hasClaimedName: true }] }, isLoading: false })
      renderOverview({ address: '0xabc', isOwnProfile: true })

      fireEvent.click(screen.getByText('profile.header.manage_world'))
      expect(openSpy).toHaveBeenCalledWith('https://peer.test/worlds', '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })
  })

  describe('when badges are loading', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai' }] }, isLoading: false })
      useProfileBadgesMock.mockReturnValue({ badges: [], isLoading: true })
    })

    it('should render a spinner in the badges section', () => {
      renderOverview()
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('when the profile has badges', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai' }] }, isLoading: false })
      useProfileBadgesMock.mockReturnValue({
        isLoading: false,
        badges: [
          {
            id: 'badge-tiered',
            name: 'Scene Builder',
            imageUrl: 'https://badges.test/builder.png',
            tierName: 'Silver',
            description: 'Bronze: 50 scenes;Silver: 250 scenes',
            progress: { lastCompletedTierAt: String(Date.UTC(2024, 0, 15)) }
          },
          {
            id: 'badge-fallback',
            name: 'Pioneer',
            imageUrl: '',
            completedAt: Date.UTC(2023, 5, 1)
          }
        ]
      })
    })

    it('should render the badge image when an imageUrl is present', () => {
      renderOverview()
      const image = screen.getByAltText('Scene Builder')
      expect(image.getAttribute('src')).toBe('https://badges.test/builder.png')
    })

    it('should render the initial-letter fallback when the badge has no image', () => {
      renderOverview()
      const fallback = screen.getByTestId('badge-fallback')
      expect(fallback).toHaveTextContent('P')
    })

    it('should surface the tier name and the achieved-tier blurb in the tooltip', () => {
      renderOverview()
      expect(screen.getByText('Silver')).toBeInTheDocument()
      expect(screen.getByText('250 scenes')).toBeInTheDocument()
    })

    it('should render the unlocked-on date for completed badges', () => {
      renderOverview()
      // Both badges carry a completed date (one via progress.lastCompletedTierAt, one via completedAt).
      expect(screen.getAllByText('profile.overview.badge_unlocked_on').length).toBe(2)
    })
  })

  describe('when the avatar exposes info fields and links', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({
        data: {
          avatars: [
            {
              name: 'Brai',
              country: 'Argentina',
              language: 'Spanish',
              links: [
                { title: 'My site', url: 'https://decentraland.org' },
                { title: 'Evil', url: 'javascript:alert(1)' },
                { url: 'https://twitter.com/brai' }
              ]
            }
          ]
        },
        isLoading: false
      })
    })

    it('should render only the populated info fields', () => {
      renderOverview()
      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Spanish')).toBeInTheDocument()
      expect(screen.getByText('profile.overview.country')).toBeInTheDocument()
    })

    it('should render safe links and drop the javascript: payload', () => {
      renderOverview()
      const links = screen.getAllByTestId('link-pill')
      // 2 of 3 links survive: the https site and the twitter link; the javascript: link is dropped.
      expect(links).toHaveLength(2)
      expect(screen.getByText('My site')).toBeInTheDocument()
      // The untitled twitter link falls back to the detected provider name.
      expect(screen.getByText('Twitter')).toBeInTheDocument()
    })
  })

  describe('when equipped collectibles are present', () => {
    const collectible = {
      urn: 'urn:decentraland:matic:collections-v2:0xabc:1',
      name: 'Cool Hat',
      thumbnail: 'https://img.test/hat.png',
      rarity: 'epic',
      network: 'MATIC',
      marketplaceUrl: 'https://decentraland.org/marketplace/item',
      creator: '0xcreator',
      price: '5000000000000000000',
      isOnSale: true,
      wearableCategory: 'hat',
      bodyShapes: ['BaseMale'],
      isSmart: false
    }

    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai' }] }, isLoading: false })
      useEquippedCollectiblesMock.mockReturnValue({ collectibles: [collectible], isLoading: false })
    })

    it('should wrap each card in a marketplace link on the own profile', () => {
      renderOverview({ address: '0xabc', isOwnProfile: true })
      const link = screen.getByTestId('equipped-card-link')
      expect(link.getAttribute('href')).toBe('https://decentraland.org/marketplace/item')
      expect(screen.getByTestId('equipped-card')).toBeInTheDocument()
    })

    it('should render a buy button on a member profile instead of a wrapping link', () => {
      renderOverview({ address: '0xabc', isOwnProfile: false })
      expect(screen.queryByTestId('equipped-card-link')).not.toBeInTheDocument()
      expect(screen.getByText('profile.overview.buy')).toBeInTheDocument()
    })
  })

  describe('when equipped collectibles are still loading', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai' }] }, isLoading: false })
      useEquippedCollectiblesMock.mockReturnValue({ collectibles: [], isLoading: true })
    })

    it('should render a spinner in the equipped-items section', () => {
      renderOverview()
      expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('when there are no equipped collectibles', () => {
    beforeEach(() => {
      useGetProfileQueryMock.mockReturnValue({ data: { avatars: [{ name: 'Brai' }] }, isLoading: false })
      useEquippedCollectiblesMock.mockReturnValue({ collectibles: [], isLoading: false })
    })

    it('should render the empty wearables message', () => {
      renderOverview()
      expect(screen.getByText('profile.overview.no_wearables')).toBeInTheDocument()
    })
  })
})

import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { OverviewTab } from './OverviewTab'

const useGetProfileQueryMock = jest.fn()

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
  CatalogCard: ({ asset, imageSrc }: { asset: { name: string }; imageSrc: string }) =>
    mockReact.createElement('div', { 'data-testid': 'equipped-card', 'data-name': asset?.name, 'data-image': imageSrc }),
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Tooltip: ({ children }: { children: React.ReactElement }) => children,
  Typography: ({ children }: { children: React.ReactNode }) => mockReact.createElement('p', null, children),
  styled: () => (component: unknown) => component
}))

jest.mock('./OverviewTab.creator', () => ({
  CreatorByLine: () => null
}))

jest.mock('../../../config/env', () => ({
  getEnv: () => 'https://peer.test'
}))

jest.mock('../../../features/profile/profile.badges.client', () => ({
  useProfileBadges: () => ({ badges: [], isLoading: false })
}))

jest.mock('../../../features/profile/profile.wearables.client', () => ({
  useEquippedCollectibles: () => ({ collectibles: [], isLoading: false })
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
    EquippedGrid: make('equipped-grid'),
    InfoGrid: make('info-grid'),
    InfoItem: make('info-item'),
    InfoLabel: make('info-label', 'span'),
    InfoSurface: make('info-surface'),
    InfoValue: make('info-value', 'span'),
    LinkPill: make('link-pill', 'a'),
    LinkPillIcon: make('link-pill-icon', 'span'),
    LinksRow: make('links-row'),
    LoadingRow: make('loading-row'),
    OverviewRoot: make('overview-root'),
    SectionHeader: make('section-header'),
    SectionTitle: make('section-title', 'h3')
  }
})

function renderOverview(props: { address: string; isOwnProfile: boolean } = { address: '0xabc', isOwnProfile: false }) {
  return render(<OverviewTab {...props} />)
}

describe('OverviewTab', () => {
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
})

import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import { AssetsTab } from './AssetsTab'

jest.mock('decentraland-ui2', () => ({
  AssetPreviewPlayerProvider: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  Box: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
    mockReact.createElement('button', { onClick }, children),
  CatalogCard: ({ bottomAction, infoBadges }: { bottomAction?: React.ReactNode; infoBadges?: React.ReactNode }) =>
    mockReact.createElement('div', { 'data-testid': 'catalog-card' }, infoBadges, bottomAction),
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Typography: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children)
}))
jest.mock('../../../components/profile/FilterChips', () => ({
  FilterChip: ({ label, onClick }: { label: string; onClick?: () => void }) => mockReact.createElement('button', { onClick }, label)
}))
jest.mock('./AssetsTab.styled', () => {
  const r = jest.requireActual<typeof mockReact>('react')
  const stub = ({ children }: { children?: React.ReactNode }) => r.createElement('div', null, children)
  return new Proxy({ __esModule: true } as Record<string, unknown>, {
    get: (target, prop) => (prop in target ? target[prop as string] : typeof prop === 'string' ? stub : undefined)
  })
})
jest.mock('./OverviewTab.styled', () => ({
  EmptyBio: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children),
  EquippedGrid: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  LoadingRow: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))
jest.mock('./OverviewTab.icons', () => ({ WearableInfoBadges: () => null }))
jest.mock('./OverviewTab.helpers', () => ({ formatPriceMana: () => '', toItemNetwork: () => 'MATIC', toRarity: () => undefined }))
jest.mock('../../../config/env', () => ({ getEnv: () => 'https://decentraland.org/marketplace' }))
jest.mock('../../../features/profile/profile.assets.client', () => ({ useGetProfileAssetsQuery: jest.fn() }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (key: string) => key }))
jest.mock('../../../components/profile/ProfileEmptyState', () => ({
  ProfileEmptyState: ({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; href?: string } }) =>
    mockReact.createElement(
      'div',
      { 'data-testid': 'empty-state' },
      mockReact.createElement('p', null, title),
      subtitle ? mockReact.createElement('p', null, subtitle) : null,
      action ? mockReact.createElement('a', { 'data-href': action.href }, action.label) : null
    )
}))

const mockedQuery = useGetProfileAssetsQuery as jest.MockedFunction<typeof useGetProfileAssetsQuery>
const ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

type QueryArg = { address: string; category?: string; limit?: number; offset?: number }

const emptyResult = { data: { total: 0, data: [] }, isLoading: false, isFetching: false }

// The component fires 5 `limit:1` availability probes (one per category) plus the
// main paginated query. This helper lets a test declare which categories exist
// and what the paginated query returns, by inspecting each call's arguments.
function installQuery(options: {
  availableCategories?: string[]
  page?: { total: number; data: unknown[]; isFetching?: boolean; isLoading?: boolean }
}) {
  const { availableCategories = [], page } = options
  mockedQuery.mockImplementation((arg, opts) => {
    const { category, limit } = (arg ?? {}) as QueryArg
    // Availability probes use limit:1.
    if (limit === 1) {
      const total = category && availableCategories.includes(category) ? 1 : 0
      return { data: { total, data: [] }, isLoading: false, isFetching: false } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
    }
    // Skipped main query (no effective category).
    if ((opts as { skip?: boolean } | undefined)?.skip) {
      return { data: undefined, isLoading: false, isFetching: false } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
    }
    return {
      data: { total: page?.total ?? 0, data: page?.data ?? [] },
      isLoading: page?.isLoading ?? false,
      isFetching: page?.isFetching ?? false
    } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
  })
}

function makeWearableEntry(id: string) {
  return {
    nft: {
      id,
      tokenId: id,
      contractAddress: '0xcontract',
      name: `Wearable ${id}`,
      image: `https://img.test/${id}.png`,
      url: `/contracts/0xcontract/tokens/${id}`,
      category: 'wearable',
      network: 'MATIC',
      urn: `urn:wearable:${id}`,
      owner: '0xowner',
      data: { wearable: { category: 'hat', bodyShapes: ['BaseMale'], rarity: 'rare', isSmart: false } }
    },
    order: { id: 'o1', price: '1000000000000000000', status: 'open', contractAddress: '0xcontract', tokenId: id },
    rental: null
  }
}

function makeEnsEntry(id: string, name: string) {
  return {
    nft: {
      id,
      tokenId: id,
      contractAddress: '0xens',
      name,
      image: '',
      url: `/contracts/0xens/tokens/${id}`,
      category: 'ens',
      network: 'ETHEREUM',
      owner: '0xowner'
    },
    order: null,
    rental: null
  }
}

describe('AssetsTab', () => {
  beforeEach(() => {
    mockedQuery.mockReturnValue(emptyResult as unknown as ReturnType<typeof useGetProfileAssetsQuery>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the owner has no assets', () => {
    it('should render the rich empty state with a marketplace CTA on the own profile', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.empty_title')).toBeInTheDocument()
      const cta = screen.getByText('profile.assets.empty_owner_cta')
      expect(cta.getAttribute('data-href')).toBe('https://decentraland.org/marketplace')
    })

    it('should render the plain member message without a CTA on a member profile', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.queryByTestId('empty-state')).toBeNull()
      expect(screen.getByText('profile.assets.empty_description')).toBeInTheDocument()
    })
  })

  describe('when the initial page is loading', () => {
    it('should render a loading spinner', () => {
      installQuery({ availableCategories: ['wearable'], page: { total: 0, data: [], isLoading: true } })
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when the owner has wearables', () => {
    beforeEach(() => {
      installQuery({
        availableCategories: ['wearable', 'emote'],
        page: { total: 1, data: [makeWearableEntry('w1')] }
      })
    })

    it('should render the item count and a card grid', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.assets.count')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.view')).toBeInTheDocument()
    })

    it('should render only the filter chips for categories that have items', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.assets.filter_wearables')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.filter_emotes')).toBeInTheDocument()
      expect(screen.queryByText('profile.assets.filter_names')).toBeNull()
    })
  })

  describe('when the owner has ENS names', () => {
    beforeEach(() => {
      installQuery({
        availableCategories: ['ens'],
        page: { total: 1, data: [makeEnsEntry('n1', 'Brai.dcl.eth')] }
      })
    })

    it('should render the name stem with edit and transfer actions', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByText('Brai')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.edit')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.transfer')).toBeInTheDocument()
    })
  })

  describe('when more items are available than the first page', () => {
    it('should render a load-more button', () => {
      installQuery({
        availableCategories: ['wearable'],
        page: { total: 50, data: [makeWearableEntry('w1')] }
      })
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.creations.load_more')).toBeInTheDocument()
    })
  })

  describe('when a subsequent page is fetching', () => {
    it('should render a trailing spinner alongside the existing items', () => {
      installQuery({
        availableCategories: ['wearable'],
        page: { total: 1, data: [makeWearableEntry('w1')], isFetching: true }
      })
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      // Items already rendered, plus the in-flight spinner.
      expect(screen.getByText('profile.assets.view')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when the user switches categories', () => {
    it('should query the newly selected category and reset the accumulated page', () => {
      installQuery({
        availableCategories: ['wearable', 'ens'],
        page: { total: 1, data: [makeWearableEntry('w1')] }
      })
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      fireEvent.click(screen.getByText('profile.assets.filter_names'))

      // After switching to ENS the cache key changes, resetting the accumulator,
      // and the main query is re-issued for the `ens` category.
      expect(mockedQuery).toHaveBeenCalledWith(expect.objectContaining({ address: ADDRESS, category: 'ens', limit: 24 }), expect.anything())
    })
  })

  describe('when the user loads more items', () => {
    it('should advance the offset to fetch the next page', () => {
      installQuery({
        availableCategories: ['wearable'],
        page: { total: 50, data: [makeWearableEntry('w1')] }
      })
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      mockedQuery.mockClear()
      fireEvent.click(screen.getByText('profile.creations.load_more'))

      // The paginated query is re-issued with a non-zero offset (the count of items shown).
      expect(mockedQuery).toHaveBeenCalledWith(expect.objectContaining({ offset: 1, limit: 24 }), expect.anything())
    })
  })

  describe('when the selected category drops to zero availability', () => {
    it('should clear the local pick and fall back to the next available category', () => {
      // First render: emote is available and selected by the user.
      installQuery({
        availableCategories: ['wearable', 'emote'],
        page: { total: 1, data: [makeWearableEntry('w1')] }
      })
      const { rerender } = render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)
      fireEvent.click(screen.getByText('profile.assets.filter_emotes'))

      // Data refreshes: emote no longer has items.
      installQuery({
        availableCategories: ['wearable'],
        page: { total: 1, data: [makeWearableEntry('w1')] }
      })
      rerender(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      // The emote chip disappears; wearable remains the fallback.
      expect(screen.queryByText('profile.assets.filter_emotes')).toBeNull()
      expect(screen.getByText('profile.assets.filter_wearables')).toBeInTheDocument()
    })
  })
})

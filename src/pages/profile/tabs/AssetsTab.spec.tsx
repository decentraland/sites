import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import type { AssetsQuery } from '../../../features/profile/profile.assets.client'
import { AssetsTab } from './AssetsTab'

jest.mock('decentraland-ui2', () => ({
  AssetPreviewPlayerProvider: ({ children, enabled }: { children?: React.ReactNode; enabled: boolean }) =>
    mockReact.createElement('div', { 'data-testid': 'preview-provider', 'data-enabled': String(enabled) }, children),
  Box: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
    mockReact.createElement('button', { onClick }, children),
  CatalogCard: ({
    asset,
    bottomAction,
    infoBadges
  }: {
    asset: { name: string }
    bottomAction?: React.ReactNode
    infoBadges?: React.ReactNode
  }) => mockReact.createElement('div', { 'data-testid': 'catalog-card' }, asset.name, infoBadges, bottomAction),
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

let mockedQuery: jest.MockedFunction<typeof useGetProfileAssetsQuery>
const ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SECOND_ADDRESS = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

function installQuery(options: { page?: { total: number; data: unknown[]; isFetching?: boolean; isLoading?: boolean } }) {
  const { page } = options
  mockedQuery.mockImplementation(() => {
    return {
      currentData: { total: page?.total ?? 0, data: page?.data ?? [] },
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

describe('when viewing profile assets', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    mockedQuery = useGetProfileAssetsQuery as jest.MockedFunction<typeof useGetProfileAssetsQuery>
    mockedQuery.mockReturnValue({ currentData: { total: 0, data: [] }, isLoading: false, isFetching: false } as unknown as ReturnType<
      typeof useGetProfileAssetsQuery
    >)
    user = userEvent.setup()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the owner has no assets', () => {
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

  describe('and the initial page is loading', () => {
    beforeEach(() => {
      installQuery({ page: { total: 0, data: [], isLoading: true } })
    })

    it('should render a loading spinner', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('and the owner has wearables', () => {
    beforeEach(() => {
      installQuery({ page: { total: 1, data: [makeWearableEntry('w1')] } })
    })

    it('should render the item count and a card grid', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.assets.count')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.view')).toBeInTheDocument()
    })

    it('should offer the All category', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.assets.filter_all')).toBeInTheDocument()
    })

    it('should offer category filters even before their counts are known', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.assets.filter_names')).toBeInTheDocument()
    })

    it('should keep wearable previews enabled in the All view', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByTestId('preview-provider')).toHaveAttribute('data-enabled', 'true')
    })
  })

  describe('and the owner has ENS names', () => {
    beforeEach(() => {
      installQuery({ page: { total: 1, data: [makeEnsEntry('n1', 'Brai.dcl.eth')] } })
    })

    it('should keep the Edit action visible in the All view when only names are owned', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByText('profile.assets.edit')).toBeInTheDocument()
    })

    it('should render the name stem with edit and transfer actions', async () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={true} />)
      await user.click(screen.getByText('profile.assets.filter_names'))

      expect(screen.getByText('Brai')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.edit')).toBeInTheDocument()
      expect(screen.getByText('profile.assets.transfer')).toBeInTheDocument()
    })

    it('should leave previews off for a names-only All view', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByTestId('preview-provider')).toHaveAttribute('data-enabled', 'false')
    })
  })

  describe('and more items are available than the first page', () => {
    beforeEach(() => {
      installQuery({ page: { total: 50, data: [makeWearableEntry('w1')] } })
    })

    it('should render a load-more button', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.creations.load_more')).toBeInTheDocument()
    })
  })

  describe('and a subsequent page is fetching', () => {
    beforeEach(() => {
      installQuery({ page: { total: 1, data: [makeWearableEntry('w1')], isFetching: true } })
    })

    it('should render a trailing spinner alongside the existing items', () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      // Items already rendered, plus the in-flight spinner.
      expect(screen.getByText('profile.assets.view')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('and the user loads more items', () => {
    let firstPage: ReturnType<typeof makeWearableEntry>
    let secondPage: ReturnType<typeof makeWearableEntry>

    beforeEach(() => {
      firstPage = makeWearableEntry('w1')
      secondPage = makeWearableEntry('w2')
      mockedQuery.mockImplementation(arg => {
        const query = arg as AssetsQuery
        const page = { total: 2, data: query.offset === 0 ? [firstPage] : [secondPage] }
        return { currentData: page, isLoading: false, isFetching: false } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
      })
    })

    it('should show the second page after loading more', async () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)

      await user.click(screen.getByText('profile.creations.load_more'))

      expect(screen.getByText('Wearable w2')).toBeInTheDocument()
    })
  })

  describe('and the visitor switches categories after loading more assets', () => {
    let wearable: ReturnType<typeof makeWearableEntry>
    let name: ReturnType<typeof makeEnsEntry>

    beforeEach(() => {
      wearable = makeWearableEntry('w1')
      name = makeEnsEntry('n1', 'Brai.dcl.eth')
      mockedQuery.mockImplementation(arg => {
        const query = arg as AssetsQuery
        const page = query.category === 'ens' && query.offset === 0 ? { total: 1, data: [name] } : { total: 50, data: [wearable] }
        return { currentData: page, isLoading: false, isFetching: false } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
      })
    })

    it('should show the first page of the newly selected category', async () => {
      render(<AssetsTab address={ADDRESS} isOwnProfile={false} />)
      await user.click(screen.getByText('profile.creations.load_more'))

      await user.click(screen.getByText('profile.assets.filter_names'))

      expect(screen.getByText('Brai')).toBeInTheDocument()
    })
  })

  describe('and the visitor opens another profile', () => {
    let rerender: ReturnType<typeof render>['rerender']
    let firstAsset: ReturnType<typeof makeWearableEntry>
    let secondAsset: ReturnType<typeof makeWearableEntry>

    beforeEach(async () => {
      firstAsset = makeWearableEntry('w1')
      secondAsset = makeWearableEntry('w2')
      mockedQuery.mockImplementation(arg => {
        const query = arg as AssetsQuery
        const page = { total: 1, data: [query.address === SECOND_ADDRESS ? secondAsset : firstAsset] }
        return { currentData: page, isLoading: false, isFetching: false } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
      })
      rerender = render(<AssetsTab address={ADDRESS} isOwnProfile={false} />).rerender
      await user.click(screen.getByText('profile.assets.filter_names'))
    })

    it('should show the other profile in the All view', () => {
      rerender(<AssetsTab address={SECOND_ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('Wearable w2')).toBeInTheDocument()
    })
  })

  describe('and the selected category has no items', () => {
    let rerender: ReturnType<typeof render>['rerender']
    let allPage: { total: number; data: unknown[] }
    let emptyPage: { total: number; data: unknown[] }

    beforeEach(() => {
      allPage = { total: 1, data: [makeWearableEntry('w1')] }
      emptyPage = { total: 0, data: [] }
      mockedQuery.mockImplementation(arg => {
        const query = arg as AssetsQuery
        const page = query.category === 'emote' ? emptyPage : allPage
        return { currentData: page, isLoading: false, isFetching: false } as unknown as ReturnType<typeof useGetProfileAssetsQuery>
      })
      rerender = render(<AssetsTab address={ADDRESS} isOwnProfile={false} />).rerender
    })

    it('should show an empty state for that category', async () => {
      await user.click(screen.getByText('profile.assets.filter_emotes'))

      expect(screen.getByText('profile.assets.count')).toBeInTheDocument()
    })

    it('should let the visitor return to all assets', async () => {
      await user.click(screen.getByText('profile.assets.filter_emotes'))

      await user.click(screen.getByText('profile.assets.filter_all'))

      expect(screen.getByText('profile.assets.view')).toBeInTheDocument()
    })

    it('should not claim that the owner has no assets', async () => {
      rerender(<AssetsTab address={ADDRESS} isOwnProfile={true} />)

      await user.click(screen.getByText('profile.assets.filter_emotes'))

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    })
  })
})

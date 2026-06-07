import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { AssetsTab } from './AssetsTab'

const useGetProfileAssetsQueryMock = jest.fn()

jest.mock('../../../features/profile/profile.assets.client', () => ({
  useGetProfileAssetsQuery: (arg: unknown, opts?: unknown) => useGetProfileAssetsQueryMock(arg, opts)
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../config/env', () => ({
  getEnv: () => 'https://market.test'
}))

jest.mock('../../../components/profile/CatalogCard', () => ({
  CatalogCard: ({ asset, price }: { asset: { name: string; rarity: string }; price?: string }) =>
    mockReact.createElement('div', {
      'data-testid': 'catalog-card',
      'data-name': asset?.name,
      'data-rarity': asset?.rarity,
      'data-price': price ?? ''
    })
}))

jest.mock('./OverviewTab.icons', () => ({
  WearableInfoBadges: () => null
}))

// Default exports for the MUI icons used in the category filter list / ens row.
jest.mock('@mui/icons-material/AlternateEmailRounded', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/CheckroomOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/EmojiEmotionsOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/LandscapeOutlined', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/MapOutlined', () => ({ __esModule: true, default: () => null }))

jest.mock('decentraland-ui2', () => ({
  Box: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  Button: ({ children, onClick, href }: { children?: React.ReactNode; onClick?: () => void; href?: string }) =>
    mockReact.createElement('button', { onClick, 'data-href': href, type: 'button' }, children),
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Typography: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children)
}))

jest.mock('./OverviewTab.styled', () => ({
  EmptyBio: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children),
  EquippedGrid: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  LoadingRow: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))

jest.mock('./AssetsTab.styled', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
  return {
    AssetFilterChip: ({ label, onClick }: { label: string; onClick?: () => void }) =>
      mockReact.createElement('button', { onClick, type: 'button' }, label),
    AssetsFilters: passthrough,
    AssetsHeader: passthrough,
    NameRow: passthrough,
    NameCard: passthrough,
    NameLabel: passthrough,
    NameLogoTile: passthrough,
    NameSuffix: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('span', null, children),
    NameActions: passthrough,
    RarityFilterControl: passthrough,
    RarityFilterSelect: ({
      value,
      onChange,
      children,
      'aria-label': ariaLabel
    }: {
      value: string
      onChange: (event: { target: { value: string } }) => void
      children?: React.ReactNode
      'aria-label'?: string
    }) => mockReact.createElement('select', { value, onChange, 'aria-label': ariaLabel }, children),
    RarityFilterItem: ({ value, children }: { value: string; children?: React.ReactNode }) =>
      mockReact.createElement('option', { value }, children)
  }
})

interface AssetEntryShape {
  nft: {
    id: string
    tokenId: string
    contractAddress: string
    name: string
    image: string
    url: string
    category: string
    network: string
    owner: string
    data?: { wearable?: { category?: string; rarity?: string; bodyShapes?: string[]; isSmart?: boolean } }
  }
  order: { id: string; price: string; status: string; contractAddress: string; tokenId: string } | null
  rental: null
}

function wearable(id: string, rarity = 'epic', withOrder = true): AssetEntryShape {
  return {
    nft: {
      id,
      tokenId: id,
      contractAddress: '0xcontract',
      name: `Wearable ${id}`,
      image: `image-${id}`,
      url: `/contracts/0xcontract/tokens/${id}`,
      category: 'wearable',
      network: 'MATIC',
      owner: '0xowner',
      data: { wearable: { category: 'hat', rarity, bodyShapes: [], isSmart: false } }
    },
    order: withOrder
      ? { id: `order-${id}`, price: '1000000000000000000', status: 'open', contractAddress: '0xcontract', tokenId: id }
      : null,
    rental: null
  }
}

function ens(id: string, name: string): AssetEntryShape {
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

interface MainResult {
  data?: { data: AssetEntryShape[]; total: number }
  isFetching?: boolean
  isLoading?: boolean
}

let availableSet: Set<string>

function configure({ available = ['wearable'], main = {} }: { available?: string[]; main?: MainResult }) {
  availableSet = new Set(available)
  useGetProfileAssetsQueryMock.mockImplementation((arg: { category: string; limit?: number }) => {
    // Availability probes fire with limit:1; main query uses the page size.
    if (arg.limit === 1) {
      return { data: { total: availableSet.has(arg.category) ? 1 : 0, data: [] } }
    }
    return { data: main.data, isFetching: !!main.isFetching, isLoading: !!main.isLoading }
  })
}

// The main (non-probe) calls recorded against the query hook this render cycle.
function mainCalls(): Array<{ category: string; rarity?: string; offset?: number; limit?: number }> {
  return useGetProfileAssetsQueryMock.mock.calls.map(call => call[0]).filter(arg => arg.limit !== 1)
}

function lastMainCall() {
  const calls = mainCalls()
  return calls[calls.length - 1]
}

describe('AssetsTab', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the first available category is still loading', () => {
    beforeEach(() => {
      configure({ available: ['wearable'], main: { data: undefined, isLoading: true } })
    })

    it('should render a loading spinner', () => {
      render(<AssetsTab address="0xABC" />)
      expect(screen.getByRole('progressbar')).toBeTruthy()
    })
  })

  describe('when the selected category has no assets', () => {
    beforeEach(() => {
      configure({ available: ['wearable'], main: { data: { data: [], total: 0 }, isLoading: false } })
    })

    it('should render the empty description', () => {
      render(<AssetsTab address="0xABC" />)
      expect(screen.getByText('profile.assets.empty_description')).toBeTruthy()
    })
  })

  describe('when wearables are returned', () => {
    beforeEach(() => {
      configure({ available: ['wearable'], main: { data: { data: [wearable('1'), wearable('2', 'legendary', false)], total: 2 } } })
    })

    it('should render a catalog card per asset', () => {
      render(<AssetsTab address="0xABC" />)
      expect(screen.getAllByTestId('catalog-card')).toHaveLength(2)
    })

    it('should render the rarity filter for wearable categories', () => {
      render(<AssetsTab address="0xABC" />)
      const select = screen.getByRole<HTMLSelectElement>('combobox')
      expect(select.value).toBe('')
      // "All rarities" + the 8 rarity tiers.
      expect(screen.getAllByRole('option')).toHaveLength(9)
    })
  })

  describe('when the rarity filter changes', () => {
    beforeEach(() => {
      configure({ available: ['wearable'], main: { data: { data: [wearable('1')], total: 1 } } })
    })

    it('should pass the selected rarity to the assets query', () => {
      render(<AssetsTab address="0xABC" />)
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mythic' } })
      expect(lastMainCall().rarity).toBe('mythic')
    })

    it('should not send a rarity when reset to all rarities', () => {
      render(<AssetsTab address="0xABC" />)
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'mythic' } })
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
      expect(lastMainCall().rarity).toBeUndefined()
    })
  })

  describe('when a different category chip is clicked', () => {
    beforeEach(() => {
      configure({ available: ['wearable', 'emote'], main: { data: { data: [wearable('1')], total: 1 } } })
    })

    it('should query the newly selected category', () => {
      render(<AssetsTab address="0xABC" />)
      fireEvent.click(screen.getByText('profile.assets.filter_emotes'))
      expect(lastMainCall().category).toBe('emote')
    })
  })

  describe('when the category is ens', () => {
    beforeEach(() => {
      configure({ available: ['ens'], main: { data: { data: [ens('1', 'brai.dcl.eth')], total: 1 } } })
    })

    it('should render name rows with edit and transfer actions instead of a rarity filter', () => {
      render(<AssetsTab address="0xABC" />)
      expect(screen.getByText('brai')).toBeTruthy()
      expect(screen.getByText('profile.assets.edit')).toBeTruthy()
      expect(screen.getByText('profile.assets.transfer')).toBeTruthy()
      expect(screen.queryByRole('combobox')).toBeNull()
    })
  })

  describe('when more assets are available than the current page', () => {
    beforeEach(() => {
      configure({ available: ['wearable'], main: { data: { data: [wearable('1'), wearable('2')], total: 5 }, isFetching: false } })
    })

    it('should advance the offset when load more is clicked', () => {
      render(<AssetsTab address="0xABC" />)
      fireEvent.click(screen.getByText('profile.creations.load_more'))
      expect(lastMainCall().offset).toBe(2)
    })
  })

  describe('when fetching an additional page', () => {
    beforeEach(() => {
      configure({ available: ['wearable'], main: { data: { data: [wearable('1')], total: 1 }, isFetching: true } })
    })

    it('should render the inline fetching spinner', () => {
      render(<AssetsTab address="0xABC" />)
      expect(screen.getByRole('progressbar')).toBeTruthy()
    })
  })

  describe('when the selected category becomes unavailable', () => {
    beforeEach(() => {
      configure({ available: ['wearable', 'emote'], main: { data: { data: [wearable('1')], total: 1 } } })
    })

    it('should fall back to the next available category', () => {
      const { rerender } = render(<AssetsTab address="0xABC" />)
      fireEvent.click(screen.getByText('profile.assets.filter_emotes'))
      expect(lastMainCall().category).toBe('emote')
      // Emote drops out of the available set on the next data refresh.
      availableSet = new Set(['wearable'])
      rerender(<AssetsTab address="0xABC" />)
      expect(lastMainCall().category).toBe('wearable')
    })
  })
})

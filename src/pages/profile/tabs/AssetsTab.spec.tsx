import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import { AssetsTab } from './AssetsTab'

jest.mock('decentraland-ui2', () => ({
  AssetPreviewPlayerProvider: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  Box: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children),
  Button: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('button', null, children),
  CatalogCard: () => mockReact.createElement('div'),
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  Typography: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children)
}))
jest.mock('../../../components/profile/FilterChips', () => ({
  FilterChip: ({ label }: { label: string }) => mockReact.createElement('button', null, label)
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

describe('AssetsTab', () => {
  beforeEach(() => {
    mockedQuery.mockReturnValue({ data: { total: 0, data: [] }, isLoading: false, isFetching: false } as unknown as ReturnType<
      typeof useGetProfileAssetsQuery
    >)
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
})

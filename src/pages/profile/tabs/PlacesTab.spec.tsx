import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGetProfileFavoritePlacesQuery, useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import { PlacesTab } from './PlacesTab'

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  SceneCard: ({ sceneName, avatar, coordinates }: { sceneName: string; avatar?: { name?: string }; coordinates?: string }) =>
    mockReact.createElement('div', { 'data-testid': 'scene-card', 'data-owner': avatar?.name, 'data-coordinates': coordinates }, sceneName),
  Typography: ({ children }: { children: React.ReactNode }) => mockReact.createElement('p', null, children),
  Box: ({ children, ...rest }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) =>
    mockReact.createElement('div', rest, children),
  Chip: ({ label, onClick, $active }: { label: string; onClick?: () => void; $active?: boolean }) =>
    mockReact.createElement('button', { onClick, 'aria-pressed': Boolean($active) }, label),
  styled: () => (component: unknown) => component
}))
jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: jest.fn() })
}))
jest.mock('../../../components/profile/FilterChips', () => {
  const actualReact = jest.requireActual<typeof mockReact>('react')
  return {
    FiltersRow: ({ children }: { children?: React.ReactNode }) => actualReact.createElement('div', null, children),
    FilterChip: ({ label, onClick, $active }: { label: string; onClick?: () => void; $active?: boolean }) =>
      actualReact.createElement('button', { onClick, 'aria-pressed': Boolean($active) }, label)
  }
})
jest.mock('../../../components/profile/PlaceDetailModal', () => ({
  PlaceDetailModal: () => null,
  useOpenPlaceModal: () => ({ openPlace: null, open: jest.fn(), close: jest.fn() })
}))
jest.mock('../../../features/profile/profile.places.client', () => ({
  useGetProfilePlacesQuery: jest.fn(),
  useGetProfileFavoritePlacesQuery: jest.fn()
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))
jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: () => ({ avatar: { name: 'ProfileOwner', ethAddress: '0xaaa' } })
}))
jest.mock('./OverviewTab.styled', () => ({
  EmptyBio: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('p', null, children),
  LoadingRow: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
}))
jest.mock('./PlacesTab.styled', () => ({
  PlacesGrid: ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', { 'data-testid': 'places-grid' }, children)
}))

const mockedOwnedQuery = useGetProfilePlacesQuery as jest.MockedFunction<typeof useGetProfilePlacesQuery>
const mockedFavoritesQuery = useGetProfileFavoritePlacesQuery as jest.MockedFunction<typeof useGetProfileFavoritePlacesQuery>

const ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const ownedResponse = {
  data: {
    ok: true,
    data: [
      { id: 'p1', title: 'Owned Place', image: 'https://img.test/p1.png', base_position: '10,20' },
      { id: 'w1', title: 'Owned World', world: true, world_name: 'owned.dcl.eth' }
    ],
    total: 2
  },
  isLoading: false
}

const favoritesResponse = {
  data: {
    ok: true,
    data: [
      {
        id: 'f1',
        title: 'Favorite Place',
        base_position: '1,2',
        owner: '0xbbb',
        owner_avatar: { name: 'OtherCreator', ethAddress: '0xbbb' }
      }
    ],
    total: 1
  },
  isLoading: false
}

describe('PlacesTab', () => {
  beforeEach(() => {
    mockedOwnedQuery.mockReturnValue(ownedResponse as unknown as ReturnType<typeof useGetProfilePlacesQuery>)
    mockedFavoritesQuery.mockReturnValue(favoritesResponse as unknown as ReturnType<typeof useGetProfileFavoritePlacesQuery>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when viewing a member profile', () => {
    it('should render owned places as scene cards without the view filters', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getAllByTestId('scene-card')).toHaveLength(2)
      expect(screen.queryByText('profile.places.filter_favorites')).toBeNull()
    })

    it('should attribute every card to the profile owner avatar', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      const cards = screen.getAllByTestId('scene-card')
      expect(cards.every(card => card.getAttribute('data-owner') === 'ProfileOwner')).toBe(true)
    })

    it('should not request favorites', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      expect(mockedFavoritesQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })
  })

  describe('when viewing the own profile', () => {
    it('should render the my places and favourites filters', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

      expect(screen.getByText('profile.places.filter_my_places')).toBeInTheDocument()
      expect(screen.getByText('profile.places.filter_favorites')).toBeInTheDocument()
    })

    it('should use world names as coordinates for worlds and positions for land places', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

      const cards = screen.getAllByTestId('scene-card')
      expect(cards.map(card => card.getAttribute('data-coordinates'))).toEqual(expect.arrayContaining(['owned.dcl.eth', '10,20']))
    })

    describe('and switching to the favourites view', () => {
      it('should fetch and render the favorite places attributed to their own creators', async () => {
        render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

        await userEvent.click(screen.getByText('profile.places.filter_favorites'))

        expect(mockedFavoritesQuery).toHaveBeenLastCalledWith(undefined, { skip: false })
        const card = screen.getByTestId('scene-card')
        expect(card).toHaveTextContent('Favorite Place')
        expect(card.getAttribute('data-owner')).toBe('OtherCreator')
      })

      describe('and there are no favorites', () => {
        beforeEach(() => {
          mockedFavoritesQuery.mockReturnValue({
            data: { ok: true, data: [], total: 0 },
            isLoading: false
          } as unknown as ReturnType<typeof useGetProfileFavoritePlacesQuery>)
        })

        it('should render the favourites empty state', async () => {
          render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

          await userEvent.click(screen.getByText('profile.places.filter_favorites'))

          expect(screen.getByText('profile.places.empty_favorites')).toBeInTheDocument()
        })
      })
    })
  })
})

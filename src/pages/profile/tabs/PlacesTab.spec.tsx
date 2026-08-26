import * as mockReact from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useGetProfileFavoritePlacesQuery, useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import { PlacesTab } from './PlacesTab'

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => mockReact.createElement('div', { role: 'progressbar' }),
  SceneCard: ({
    sceneName,
    avatar,
    coordinates,
    image,
    onClick,
    onJumpInTrack
  }: {
    sceneName: string
    avatar?: { name?: string }
    coordinates?: string
    image?: string
    onClick?: () => void
    onJumpInTrack?: (data: { type: string; has_launcher: boolean }) => void
  }) =>
    mockReact.createElement(
      'div',
      { 'data-testid': 'scene-card', 'data-owner': avatar?.name, 'data-coordinates': coordinates, 'data-image': image },
      mockReact.createElement('button', { 'data-testid': 'scene-open', onClick }, sceneName),
      mockReact.createElement('button', {
        'data-testid': 'scene-jump',
        onClick: () => onJumpInTrack?.({ type: 'world', has_launcher: false })
      })
    ),
  Typography: ({ children }: { children: React.ReactNode }) => mockReact.createElement('p', null, children),
  Box: ({ children, ...rest }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) =>
    mockReact.createElement('div', rest, children),
  Chip: ({ label, onClick, $active }: { label: string; onClick?: () => void; $active?: boolean }) =>
    mockReact.createElement('button', { onClick, 'aria-pressed': Boolean($active) }, label),
  styled: () => (component: unknown) => component
}))
const trackMock = jest.fn()
jest.mock('@dcl/hooks', () => ({
  useAnalytics: () => ({ track: trackMock })
}))
jest.mock('../../../components/profile/FilterChips', () => {
  const actualReact = jest.requireActual<typeof mockReact>('react')
  return {
    FiltersRow: ({ children }: { children?: React.ReactNode }) => actualReact.createElement('div', null, children),
    FilterChip: ({ label, onClick, $active }: { label: string; onClick?: () => void; $active?: boolean }) =>
      actualReact.createElement('button', { onClick, 'aria-pressed': Boolean($active) }, label)
  }
})
const openPlaceMock = jest.fn()
jest.mock('../../../components/profile/PlaceDetailModal', () => ({
  PlaceDetailModal: () => null,
  useOpenPlaceModal: () => ({ openPlace: null, open: openPlaceMock, close: jest.fn() })
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
jest.mock('../../../components/profile/ProfileEmptyState', () => ({
  JumpInBadgeIcon: () => null,
  ProfileEmptyState: ({
    title,
    subtitle,
    action
  }: {
    title: string
    subtitle?: string
    action?: { label: string; href?: string; onClick?: () => void }
  }) =>
    mockReact.createElement(
      'div',
      { 'data-testid': 'empty-state' },
      mockReact.createElement('p', null, title),
      subtitle ? mockReact.createElement('p', null, subtitle) : null,
      action ? mockReact.createElement('button', { 'data-href': action.href, onClick: action.onClick }, action.label) : null
    )
}))
const navigateMock = jest.fn()
jest.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }))
jest.mock('../../../config/env', () => ({ getEnv: () => 'https://decentraland.org/builder' }))

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

    it('should render the plain member empty message without a CTA when there are no places', () => {
      mockedOwnedQuery.mockReturnValue({ data: { ok: true, data: [], total: 0 }, isLoading: false } as unknown as ReturnType<
        typeof useGetProfilePlacesQuery
      >)

      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByText('profile.places.empty_member')).toBeInTheDocument()
      expect(screen.queryByTestId('empty-state')).toBeNull()
    })

    it('should render a loading spinner while owned places are loading', () => {
      mockedOwnedQuery.mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useGetProfilePlacesQuery>)

      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should pass a sanitized css url as the card image', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      const cards = screen.getAllByTestId('scene-card')
      const withImage = cards.find(card => card.getAttribute('data-image'))
      expect(withImage?.getAttribute('data-image')).toContain('https://img.test/p1.png')
    })

    it('should open the place detail modal when a card is clicked', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      fireEvent.click(screen.getAllByTestId('scene-open')[0])
      expect(openPlaceMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }))
    })

    it('should track a jump-in with the profile-places position', () => {
      render(<PlacesTab address={ADDRESS} isOwnProfile={false} />)

      fireEvent.click(screen.getAllByTestId('scene-jump')[0])
      expect(trackMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ position: 'profile-places' }))
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

    describe('and there are no owned places', () => {
      beforeEach(() => {
        mockedOwnedQuery.mockReturnValue({ data: { ok: true, data: [], total: 0 }, isLoading: false } as unknown as ReturnType<
          typeof useGetProfilePlacesQuery
        >)
      })

      it('should render the my places empty state with a get-a-name CTA linking to the builder', () => {
        render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

        expect(screen.getByText('profile.places.empty_owner_title')).toBeInTheDocument()
        const cta = screen.getByText('profile.places.empty_owner_cta')
        expect(cta).toBeInTheDocument()
        expect(cta.getAttribute('data-href')).toBe('https://decentraland.org/builder/names')
      })
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

          expect(screen.getByText('profile.places.empty_favorites_title')).toBeInTheDocument()
          expect(screen.getByText('profile.places.empty_favorites_cta')).toBeInTheDocument()
        })

        it('should navigate to whats-on when the explore-places CTA is clicked', async () => {
          render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

          await userEvent.click(screen.getByText('profile.places.filter_favorites'))
          fireEvent.click(screen.getByText('profile.places.empty_favorites_cta'))

          expect(navigateMock).toHaveBeenCalledWith('/events')
        })

        it('should switch back to the owned places view when the my-places filter is clicked again', async () => {
          render(<PlacesTab address={ADDRESS} isOwnProfile={true} />)

          await userEvent.click(screen.getByText('profile.places.filter_favorites'))
          expect(screen.getByText('profile.places.empty_favorites_title')).toBeInTheDocument()

          await userEvent.click(screen.getByText('profile.places.filter_my_places'))
          // Back on owned places: the owned scene cards render again.
          expect(screen.getAllByTestId('scene-card')).toHaveLength(2)
        })
      })
    })
  })
})

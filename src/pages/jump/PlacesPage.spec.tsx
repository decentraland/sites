import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useGetJumpPlacesQuery, useGetSceneMetadataQuery } from '../../features/jump'
import { PlacesPage } from './PlacesPage'

jest.mock('decentraland-ui2', () => {
  const Box = ({ children, ...rest }: { children?: React.ReactNode }) => <div {...rest}>{children}</div>
  return {
    Box,
    AnimatedBackground: () => <div data-testid="animated-background" />,
    styled: (tag: unknown) => () => tag
  }
})

jest.mock('../../features/jump', () => ({
  DEFAULT_POSITION: '0,0',
  DEFAULT_REALM: 'main',
  parsePosition: (value: string) => {
    const [x, y] = value.split(',').map(Number)
    return { original: value, coordinates: [x || 0, y || 0] as [number, number], isValid: true }
  },
  buildGenericPlace: ({ coordinates, realm }: { coordinates: [number, number]; realm?: string }) => ({
    id: 'generic',
    type: 'place' as const,
    title: realm || '',
    user_name: 'Unknown',
    coordinates,
    position: coordinates.join(',')
  }),
  fromPlace: (place: { id: string; title: string; base_position: string; owner: string | null }) => {
    const [x, y] = place.base_position.split(',').map(Number)
    return {
      id: place.id,
      type: 'place' as const,
      title: place.title,
      user_name: place.owner || 'Unknown',
      coordinates: [x, y] as [number, number],
      position: place.base_position
    }
  },
  useGetJumpPlacesQuery: jest.fn(),
  useGetSceneMetadataQuery: jest.fn()
}))

jest.mock('../../components/jump/Card', () => ({
  Card: ({ isLoading, data }: { isLoading: boolean; data?: { title: string } }) => (
    <div data-testid="card" data-loading={String(isLoading)}>
      {data?.title ?? 'no-data'}
    </div>
  )
}))

const mockUseGetJumpPlacesQuery = jest.mocked(useGetJumpPlacesQuery)
const mockUseGetSceneMetadataQuery = jest.mocked(useGetSceneMetadataQuery)

function renderWithRouter(path = '/jump/places?position=10,20') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlacesPage />
    </MemoryRouter>
  )
}

describe('PlacesPage', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when places query is loading', () => {
    beforeEach(() => {
      mockUseGetJumpPlacesQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined } as never)
      mockUseGetSceneMetadataQuery.mockReturnValue({ isLoading: false, isError: false, data: undefined } as never)
    })

    it('should render the responsive card in the loading state', () => {
      renderWithRouter()
      expect(screen.getByTestId('card')).toHaveAttribute('data-loading', 'true')
    })
  })

  describe('when places query returns data', () => {
    beforeEach(() => {
      mockUseGetJumpPlacesQuery.mockReturnValue({
        isLoading: false,
        isError: false,
        data: [
          {
            id: 'p1',
            title: 'Plaza',
            image: '',
            description: '',
            positions: ['10,20'],
            base_position: '10,20',
            owner: '0xOwner'
          }
        ]
      } as never)
      mockUseGetSceneMetadataQuery.mockReturnValue({ isLoading: false, isError: false, data: undefined } as never)
    })

    it('should render the first place', () => {
      renderWithRouter()
      expect(screen.getByText('Plaza')).toBeInTheDocument()
    })
  })

  describe('when places query returns an empty array', () => {
    beforeEach(() => {
      mockUseGetJumpPlacesQuery.mockReturnValue({ isLoading: false, isError: false, data: [] } as never)
      mockUseGetSceneMetadataQuery.mockReturnValue({ isLoading: false, isError: false, data: undefined } as never)
    })

    it('should render the generic placeholder', () => {
      renderWithRouter('/jump/places?position=50,50&realm=foo.eth')
      expect(screen.getByText('foo.eth')).toBeInTheDocument()
    })
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import type { DiscoverCommunity } from '../../features/discover'
import { DiscoverCommunitiesPage } from './DiscoverCommunitiesPage'

const mockCommunitiesQuery = jest.fn()
const mockUsePageViewTracking = jest.fn()

jest.mock('react-helmet-async', () => ({
  Helmet: () => null
}))

// The barrel re-exports the RTK Query clients (import.meta env access Jest
// can't parse); keep the pure helpers real and stub only the query hook.
jest.mock('../../features/discover', () => ({
  ...jest.requireActual('../../features/discover/discover.helpers'),
  useGetCommunitiesListQuery: (...args: unknown[]) => mockCommunitiesQuery(...args)
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null) => id ?? ''
}))

jest.mock('../../hooks/usePageViewTracking', () => ({
  usePageViewTracking: (...args: unknown[]) => mockUsePageViewTracking(...args)
}))

jest.mock('../../components/discover/CommunityCard', () => ({
  CommunityCard: ({ community }: { community: DiscoverCommunity }) => <div data-testid="community-card">{community.name}</div>
}))

// Run the real styled files through the shared styled shim. The SearchField is
// a styled(TextField); render the stub component itself so typing works.
jest.mock('decentraland-ui2', () => {
  const react = jest.requireActual<typeof import('react')>('react')
  const actual = jest.requireActual('../../__test-utils__/styledMock')

  const styled = (tag: string | React.ComponentType<Record<string, unknown>>, options?: { shouldForwardProp?: (p: string) => boolean }) => {
    const passthroughFactory = actual.styled(typeof tag === 'string' ? tag : 'div', options)
    return (style: unknown) => {
      const Passthrough = passthroughFactory(style)
      if (typeof tag === 'string') return Passthrough
      const Wrapped = react.forwardRef<unknown, Record<string, unknown>>((props, ref) => react.createElement(tag, { ...props, ref }))
      Wrapped.displayName = 'StyledWrapperMock'
      return Wrapped
    }
  }

  return {
    ...actual,
    styled,
    Typography: actual.Box,
    TextField: (props: { value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; placeholder?: string }) => (
      <input value={props.value} onChange={props.onChange} placeholder={props.placeholder} />
    ),
    InputAdornment: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    CircularProgress: () => <div role="progressbar" />,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray3: '#a09ba8', gray5: '#ecebed', softBlack1: '#161518', white: '#ffffff' },
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

function createCommunity(overrides: Partial<DiscoverCommunity> = {}): DiscoverCommunity {
  return {
    id: 'c-1',
    name: 'Builders Guild',
    description: 'we build',
    ownerAddress: '0xowner',
    privacy: 'public',
    active: true,
    membersCount: 10,
    ...overrides
  }
}

describe('DiscoverCommunitiesPage', () => {
  beforeEach(() => {
    mockCommunitiesQuery.mockReturnValue({ data: { data: { results: [], total: 0 } }, isLoading: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the list is loading', () => {
    it('should render only the centered spinner', () => {
      mockCommunitiesQuery.mockReturnValue({ data: undefined, isLoading: true })
      render(<DiscoverCommunitiesPage />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByText('discover.communities.heading')).not.toBeInTheDocument()
    })
  })

  describe('when communities resolve', () => {
    beforeEach(() => {
      mockCommunitiesQuery.mockReturnValue({
        data: {
          data: {
            results: [
              createCommunity({ id: 'c-small', name: 'Small Club', membersCount: 3 }),
              createCommunity({ id: 'c-big', name: 'Big Club', membersCount: 500 })
            ],
            total: 2
          }
        },
        isLoading: false
      })
    })

    it('should render the cards sorted by member count descending', () => {
      render(<DiscoverCommunitiesPage />)

      const names = screen.getAllByTestId('community-card').map(card => card.textContent)
      expect(names).toEqual(['Big Club', 'Small Club'])
    })

    it('should fire the page view through the tracking-exempt hook', () => {
      render(<DiscoverCommunitiesPage />)

      expect(mockUsePageViewTracking).toHaveBeenCalledWith({ name: 'discover.communities.page_title' })
    })
  })

  describe('when the visitor searches', () => {
    it('should re-query with the trimmed search term', () => {
      render(<DiscoverCommunitiesPage />)

      fireEvent.change(screen.getByPlaceholderText('discover.communities.search_placeholder'), { target: { value: '  club  ' } })

      expect(mockCommunitiesQuery).toHaveBeenCalledWith({ limit: 200, offset: 0, search: 'club' })
    })
  })

  describe('when the communities query fails', () => {
    it('should show a retryable error state instead of the empty copy', () => {
      const refetch = jest.fn()
      mockCommunitiesQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch })
      render(<DiscoverCommunitiesPage />)

      expect(screen.getByText('discover.communities.error')).toBeInTheDocument()
      expect(screen.queryByText('discover.communities.empty')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'discover.explore.retry' }))
      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('when there are no communities at all', () => {
    it('should render the empty state', () => {
      render(<DiscoverCommunitiesPage />)

      expect(screen.getByText('discover.communities.empty')).toBeInTheDocument()
    })
  })
})

import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { styledMock } from '../__fixtures__/styled-mock'
import { Search } from './Search'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockUseSearchBlogQuery = jest.fn()
jest.mock('../../../features/cms/cms.search.client', () => ({
  useSearchBlogQuery: (...args: unknown[]) => mockUseSearchBlogQuery(...args)
}))

jest.mock('./sanitizeHighlight', () => ({
  sanitizeHighlight: (input: string) => input
}))

jest.mock('./Search.styled', () => {
  const stubs = styledMock({
    MoreResultsItem: 'li',
    NoResults: 'div',
    NoResultsImage: 'span',
    SearchCloseButton: 'button',
    SearchInputContent: 'div',
    SearchOverlay: 'div',
    SearchResultDescription: 'span',
    SearchResultImage: 'img',
    SearchResultItem: 'li',
    SearchResultText: 'div',
    SearchResultTitle: 'span',
    SearchResults: 'ul'
  })
  return {
    ...stubs,
    SearchContainer: ({ children, ...rest }: { children?: React.ReactNode; $hasResults?: boolean } & Record<string, unknown>) => {
      const { $hasResults: _h, ...domProps } = rest as { $hasResults?: boolean }
      return <div {...(domProps as object)}>{children}</div>
    },
    SearchInput: ({ ...rest }: Record<string, unknown>) => <input {...(rest as object)} />,
    SearchResultLink: ({
      children,
      to,
      onClick,
      ...rest
    }: { children?: React.ReactNode; to: string; onClick?: () => void } & Record<string, unknown>) => (
      <a href={to} onClick={onClick} {...(rest as object)}>
        {children}
      </a>
    ),
    MoreResultsLink: ({
      children,
      to,
      onClick,
      ...rest
    }: { children?: React.ReactNode; to: string; onClick?: () => void } & Record<string, unknown>) => (
      <a href={to} onClick={onClick} {...(rest as object)}>
        {children}
      </a>
    )
  }
})

const sampleHits = [
  {
    id: 'sample-1',
    categorySlug: 'announcements',
    url: '/blog/announcements/sample-1',
    image: 'https://fake-cdn.test/h1.png',
    highlightedTitle: 'Sample <em>One</em>',
    highlightedDescription: 'Description one'
  },
  {
    id: 'sample-2',
    categorySlug: 'events',
    url: '/blog/events/sample-2',
    image: 'https://fake-cdn.test/h2.png',
    highlightedTitle: 'Sample <em>Two</em>',
    highlightedDescription: 'Description two'
  }
]

function setSearchQuery(value: string) {
  const input = screen.getByPlaceholderText('search.placeholder')
  fireEvent.change(input, { target: { value } })
  return input
}

async function flushDebounce() {
  // Search debounces typing by 300ms; bypass real timers with act() + jest fake timers
  await act(async () => {
    jest.advanceTimersByTime(300)
  })
}

describe('when rendering Search', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseSearchBlogQuery.mockReturnValue({ data: [], isLoading: false, error: null, isError: false })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('and the user has not typed anything', () => {
    it('should render the input with the placeholder translation key', () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      expect(screen.getByPlaceholderText('search.placeholder')).toBeInTheDocument()
    })

    it('should not show the close button', () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      expect(screen.queryByRole('button', { name: 'search.clear' })).not.toBeInTheDocument()
    })
  })

  describe('and the user types fewer than three characters', () => {
    it('should not query and not show the results dropdown', async () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      setSearchQuery('hi')
      await flushDebounce()
      // skip=true short-circuits the query: useSearchBlogQuery still gets
      // invoked, but consumers see the mock return value above. We assert
      // the dropdown stays hidden because trim().length <= 2.
      expect(screen.queryByText('search.searching')).not.toBeInTheDocument()
      expect(screen.queryByText('search.no_matches')).not.toBeInTheDocument()
    })
  })

  describe('and the user types three or more characters', () => {
    describe('and the query is loading', () => {
      beforeEach(() => {
        mockUseSearchBlogQuery.mockReturnValue({ data: [], isLoading: true, error: null, isError: false })
      })

      it('should show the searching message', async () => {
        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        )
        setSearchQuery('met')
        await flushDebounce()
        expect(screen.getByText('search.searching')).toBeInTheDocument()
      })
    })

    describe('and the query returns hits', () => {
      beforeEach(() => {
        mockUseSearchBlogQuery.mockReturnValue({ data: sampleHits, isLoading: false, error: null, isError: false })
      })

      it('should render the hit titles', async () => {
        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        )
        setSearchQuery('met')
        await flushDebounce()
        await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
        expect(screen.getByText('Two')).toBeInTheDocument()
      })

      describe('and the user presses Enter without selecting a hit', () => {
        it('should navigate to the search page with the query', async () => {
          render(
            <MemoryRouter>
              <Search />
            </MemoryRouter>
          )
          const input = setSearchQuery('metaverse')
          await flushDebounce()
          fireEvent.keyDown(input, { key: 'Enter' })
          expect(mockNavigate).toHaveBeenCalledWith('/blog/search?q=metaverse')
        })
      })
    })

    describe('and the query returns empty', () => {
      beforeEach(() => {
        mockUseSearchBlogQuery.mockReturnValue({ data: [], isLoading: false, error: null, isError: false })
      })

      it('should show the no-matches message', async () => {
        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        )
        setSearchQuery('zzz')
        await flushDebounce()
        expect(screen.getByText('search.no_matches')).toBeInTheDocument()
      })
    })

    describe('and the query errors', () => {
      beforeEach(() => {
        mockUseSearchBlogQuery.mockReturnValue({
          data: [],
          isLoading: false,
          error: { error: 'boom' },
          isError: true
        })
      })

      it('should show the search-error message', async () => {
        render(
          <MemoryRouter>
            <Search />
          </MemoryRouter>
        )
        setSearchQuery('xyz')
        await flushDebounce()
        expect(screen.getByText('search.error')).toBeInTheDocument()
      })
    })
  })

  describe('and the user presses Escape', () => {
    it('should call onClose if provided', async () => {
      const onClose = jest.fn()
      render(
        <MemoryRouter>
          <Search onClose={onClose} />
        </MemoryRouter>
      )
      const input = setSearchQuery('met')
      await flushDebounce()
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(onClose).toHaveBeenCalled()
    })
  })
})

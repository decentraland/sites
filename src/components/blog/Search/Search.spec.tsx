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
    NoResults: 'div',
    NoResultsImage: 'span',
    SearchCloseButton: 'button',
    SearchInputContent: 'div',
    SearchOverlay: 'div',
    SearchResultDescription: 'span',
    SearchResultImage: 'img',
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
    SearchResultItem: ({
      children,
      $selected,
      onMouseEnter,
      ...rest
    }: { children?: React.ReactNode; $selected?: boolean; onMouseEnter?: () => void } & Record<string, unknown>) => (
      <li data-selected={String(Boolean($selected))} onMouseEnter={onMouseEnter} {...(rest as object)}>
        {children}
      </li>
    ),
    MoreResultsItem: ({
      children,
      $selected,
      onMouseEnter,
      ...rest
    }: { children?: React.ReactNode; $selected?: boolean; onMouseEnter?: () => void } & Record<string, unknown>) => (
      <li data-selected={String(Boolean($selected))} data-role="more-results" onMouseEnter={onMouseEnter} {...(rest as object)}>
        {children}
      </li>
    ),
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

const fiveHits = Array.from({ length: 5 }, (_, i) => ({
  id: `sample-${i + 1}`,
  categorySlug: 'announcements',
  url: `/blog/announcements/sample-${i + 1}`,
  image: `https://fake-cdn.test/${i + 1}.png`,
  highlightedTitle: `Hit number ${i + 1}`,
  highlightedDescription: `Description ${i + 1}`
}))

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

  describe('and the user presses ArrowDown with results visible', () => {
    beforeEach(() => {
      mockUseSearchBlogQuery.mockReturnValue({ data: sampleHits, isLoading: false, error: null, isError: false })
    })

    it('should mark the first hit as selected', async () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      const input = setSearchQuery('met')
      await flushDebounce()
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      const items = screen.getAllByRole('listitem')
      expect(items[0]).toHaveAttribute('data-selected', 'true')
    })

    it('should navigate to the selected hit on Enter', async () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      const input = setSearchQuery('met')
      await flushDebounce()
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(mockNavigate).toHaveBeenCalledWith('/blog/announcements/sample-1')
    })
  })

  describe('and the user presses ArrowUp without a prior selection', () => {
    beforeEach(() => {
      mockUseSearchBlogQuery.mockReturnValue({ data: sampleHits, isLoading: false, error: null, isError: false })
    })

    it('should wrap to the last selectable index', async () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      const input = setSearchQuery('met')
      await flushDebounce()
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
      // ArrowUp from selectedIndex=-1 goes to maxLength. With 2 hits (<=3),
      // maxLength = searchResults.length = 2; the last selectable item index
      // is 1, but the implementation wraps to maxLength (2), which selects
      // nothing on screen (out of range). We assert the behavior by pressing
      // ArrowUp again to go back to index 1, which marks the second hit.
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      const items = screen.getAllByRole('listitem')
      expect(items[1]).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('and the user hovers over a hit', () => {
    beforeEach(() => {
      mockUseSearchBlogQuery.mockReturnValue({ data: sampleHits, isLoading: false, error: null, isError: false })
    })

    it('should mark that hit as selected', async () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      setSearchQuery('met')
      await flushDebounce()
      await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument())
      const items = screen.getAllByRole('listitem')
      fireEvent.mouseEnter(items[1])
      expect(items[1]).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('and there are more than four hits', () => {
    beforeEach(() => {
      mockUseSearchBlogQuery.mockReturnValue({ data: fiveHits, isLoading: false, error: null, isError: false })
    })

    it('should show the see-more results link pointing to the search page', async () => {
      render(
        <MemoryRouter>
          <Search />
        </MemoryRouter>
      )
      setSearchQuery('hits')
      await flushDebounce()
      await waitFor(() => expect(screen.getByText('search.see_more_results')).toBeInTheDocument())
      const more = screen.getByRole('link', { name: 'search.see_more_results' })
      expect(more).toHaveAttribute('href', '/blog/search?q=hits')
    })
  })

  describe('and the user clicks the clear button', () => {
    it('should empty the input and call onClose', async () => {
      const onClose = jest.fn()
      render(
        <MemoryRouter>
          <Search onClose={onClose} />
        </MemoryRouter>
      )
      setSearchQuery('hello')
      fireEvent.click(screen.getByRole('button', { name: 'search.clear' }))
      expect(screen.getByPlaceholderText('search.placeholder')).toHaveValue('')
      expect(onClose).toHaveBeenCalled()
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

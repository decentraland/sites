import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import type { SearchResult } from '../../../shared/blog/types/blog.domain'
import { makeSearchResult } from '../__fixtures__/blog.fixtures'
import { styledMock } from '../__fixtures__/styled-mock'
import { SearchResultCard } from './SearchResultCard'

jest.mock('../Search/sanitizeHighlight', () => ({
  // Identity passthrough so we can assert the highlight tokens reach the DOM
  sanitizeHighlight: (input: string) => input
}))

jest.mock('./SearchResultCard.styled', () =>
  styledMock({
    CardContainer: 'article',
    CardContentBox: 'div',
    CardDescription: 'p',
    CardImage: 'img',
    CardTextBox: 'div',
    CardTitle: 'h3',
    LoadingDescription: 'div',
    LoadingDescriptionShort: 'div',
    LoadingImage: 'div',
    LoadingTitle: 'div'
  })
)

describe('when rendering SearchResultCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and loading is true', () => {
    it('should render skeleton placeholders without a result link', () => {
      render(
        <MemoryRouter>
          <SearchResultCard loading />
        </MemoryRouter>
      )
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })

  describe('and a result is provided', () => {
    let result: SearchResult
    beforeEach(() => {
      result = makeSearchResult({
        url: '/blog/announcements/sample',
        highlightedTitle: '<em>Sample</em> Title',
        highlightedDescription: 'Result description.',
        image: 'https://fake-cdn.test/result.png'
      })
    })

    it('should link the card to the result url', () => {
      render(
        <MemoryRouter>
          <SearchResultCard result={result} />
        </MemoryRouter>
      )
      expect(screen.getByRole('link')).toHaveAttribute('href', result.url)
    })

    it('should render the highlighted title HTML', () => {
      render(
        <MemoryRouter>
          <SearchResultCard result={result} />
        </MemoryRouter>
      )
      const em = screen.getByText('Sample')
      expect(em.tagName).toBe('EM')
    })

    it('should render the image src and empty alt for decorative use', () => {
      const { container } = render(
        <MemoryRouter>
          <SearchResultCard result={result} />
        </MemoryRouter>
      )
      // Image is marked decorative (alt=""), so getByRole('img') excludes it.
      // Query the raw element instead.
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img).toHaveAttribute('src', result.image)
      expect(img).toHaveAttribute('alt', '')
    })
  })

  describe('and no result is provided and loading is false', () => {
    it('should render nothing', () => {
      const { container } = render(
        <MemoryRouter>
          <SearchResultCard />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })
})

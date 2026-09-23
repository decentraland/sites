import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render } from '@testing-library/react'
import type { LatestPost } from '../../../features/cms/cms.discovery.types'
import { SectionViewedTrack } from '../../../modules/segment'
import { CreatorsBlog } from './FromTheBlog'

const mockAnimatedSection = jest.fn()
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return { ...actual, Typography }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockTrackClick = jest.fn()
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
}))

jest.mock('../AnimatedSection', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatedSection: (props: any) => {
    mockAnimatedSection(props.trackPlace)
    return <div>{props.children}</div>
  }
}))

jest.mock('@mui/icons-material/ChevronRight', () => ({
  __esModule: true,
  default: () => null
}))

const mockUseGetLatestBlogPostsQuery = jest.fn()
jest.mock('../../../features/cms/cms.discovery', () => ({
  useGetLatestBlogPostsQuery: () => mockUseGetLatestBlogPostsQuery()
}))

const aPost = (overrides: Partial<LatestPost>): LatestPost => ({
  id: 'post-1',
  title: 'A Post',
  publishedDate: '2026-06-15T12:00:00Z',
  categoryTitle: 'Announcements',
  imageUrl: 'https://img.test/cover.png',
  url: '/blog/announcements/a-post',
  ...overrides
})

const renderSection = () =>
  render(
    <MemoryRouter>
      <CreatorsBlog />
    </MemoryRouter>
  )

describe('CreatorsBlog', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the posts are still loading', () => {
    beforeEach(() => {
      mockUseGetLatestBlogPostsQuery.mockReturnValue({ data: [], isLoading: true })
    })

    it('should render nothing', () => {
      const { container } = renderSection()

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when no posts are available', () => {
    beforeEach(() => {
      mockUseGetLatestBlogPostsQuery.mockReturnValue({ data: [], isLoading: false })
    })

    it('should render nothing', () => {
      const { container } = renderSection()

      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('when posts are available', () => {
    beforeEach(() => {
      mockUseGetLatestBlogPostsQuery.mockReturnValue({
        data: [
          aPost({}),
          aPost({ id: 'post-2', title: 'No Image Post', imageUrl: null, categoryTitle: null, url: '/blog/search?q=No%20Image%20Post' })
        ],
        isLoading: false
      })
    })

    it('should mark the section for the Creators Blog section-viewed event', () => {
      renderSection()

      expect(mockAnimatedSection).toHaveBeenCalledWith(SectionViewedTrack.CREATORS_BLOG)
    })

    it('should link every card to its post url', () => {
      const { container } = renderSection()

      const hrefs = Array.from(container.querySelectorAll('a'))
        .map(link => link.getAttribute('href'))
        .filter(href => href !== '/blog')
      expect(hrefs).toEqual(['/blog/announcements/a-post', '/blog/search?q=No%20Image%20Post'])
    })

    it('should render the cover image only for posts that have one', () => {
      const { container } = renderSection()

      expect(container.querySelectorAll('img')).toHaveLength(1)
    })

    it('should render the post titles and category', () => {
      const { getByText } = renderSection()

      expect(getByText('A Post')).toBeInTheDocument()
      expect(getByText('No Image Post')).toBeInTheDocument()
      expect(getByText('Announcements')).toBeInTheDocument()
    })

    it('should render a view-all link to the blog', () => {
      const { container } = renderSection()

      expect(container.querySelector('a[href="/blog"]')).toBeInTheDocument()
    })

    describe('and a post card is clicked', () => {
      it('should track the click', () => {
        const { container } = renderSection()

        fireEvent.click(container.querySelector('a')!)

        expect(mockTrackClick).toHaveBeenCalled()
      })
    })
  })
})

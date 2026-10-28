import React from 'react'
import { render, screen } from '@testing-library/react'
import { createBlogPost } from '../../__test-utils__/blogFixtures'
import { PostPage } from './PostPage'

const mockUseGetBlogPostBySlugQuery = jest.fn()
const mockUseGetBlogPostsQuery = jest.fn()
const mockUseAppSelector = jest.fn()
const mockRelatedPost = jest.fn((_props: unknown) => null)

jest.mock('react-router-dom', () => ({
  useParams: () => ({ categorySlug: 'announcements', postSlug: 'a-post' }),
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => React.createElement('a', { href: to, ...rest }, children)
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (id: string) => id })
}))

jest.mock('../../components/blog/SEO/SEO', () => ({
  SEO: () => null,

  OGType: { WEBSITE: 'website', ARTICLE: 'article', PROFILE: 'profile' }
}))

// The real layout renders `relatedPosts` in its own slot; the stub has to render it
// too or the RelatedPost element is created and never mounted.
jest.mock('../../components/blog/BlogLayout', () => ({
  BlogLayout: ({ children, relatedPosts }: { children?: React.ReactNode; relatedPosts?: React.ReactNode }) =>
    React.createElement('div', null, children, relatedPosts)
}))

jest.mock('../../components/blog/RichText', () => ({
  RichText: () => React.createElement('p', null, 'body')
}))

jest.mock('../../components/blog/RelatedPost', () => ({
  RelatedPost: (props: unknown) => mockRelatedPost(props)
}))

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://decentraland.org/blog'
}))

jest.mock('../../features/cms/cms.client', () => ({
  useGetBlogPostBySlugQuery: (...args: unknown[]) => mockUseGetBlogPostBySlugQuery(...args),
  useGetBlogPostsQuery: (...args: unknown[]) => mockUseGetBlogPostsQuery(...args)
}))

jest.mock('../../features/cms/cms.selectors', () => ({
  selectPostByCategoryAndSlug: jest.fn()
}))

jest.mock('../../shells/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args)
}))

jest.mock('../../hooks/usePageViewTracking', () => ({
  usePageViewTracking: jest.fn()
}))

// Icon-only children: the accessible name has to come from the link's aria-label,
// which is exactly what this suite guards.

jest.mock('@mui/icons-material/X', () => ({ __esModule: true, default: () => React.createElement('svg') }))

jest.mock('@mui/icons-material/Facebook', () => ({ __esModule: true, default: () => React.createElement('svg') }))

jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/ui2Mock').createUi2Mock())

const post = createBlogPost({ title: 'How to make money in virtual worlds' })

describe('when rendering a blog post', () => {
  beforeEach(() => {
    mockRelatedPost.mockReturnValue(null)
    mockUseAppSelector.mockReturnValue(post)
    mockUseGetBlogPostBySlugQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined })
    mockUseGetBlogPostsQuery.mockReturnValue({ data: { posts: [] }, isLoading: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the post title as the only level-one heading', () => {
    render(<PostPage />)

    const headings = screen.getAllByRole('heading', { level: 1 })

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(post.title)
  })

  it('should render the description as a paragraph rather than a heading', () => {
    render(<PostPage />)

    expect(screen.queryByRole('heading', { name: post.description })).not.toBeInTheDocument()
    expect(screen.getByText(post.description).tagName).toBe('P')
  })

  it('should wrap the post in an article landmark', () => {
    const { container } = render(<PostPage />)

    expect(container.querySelector('article')).toBeInTheDocument()
  })

  it('should expose the publish date as a machine-readable time element', () => {
    const { container } = render(<PostPage />)

    expect(container.querySelector('time')).toHaveAttribute('datetime', post.publishedDate)
  })

  // An empty `datetime` attribute is invalid HTML, so the element has to disappear
  // rather than render `<time datetime="">`.
  it('should omit the time element entirely when the post has no publish date', () => {
    mockUseAppSelector.mockReturnValue({ ...post, publishedDate: '' })

    const { container } = render(<PostPage />)

    expect(container.querySelector('time')).not.toBeInTheDocument()
    expect(container.querySelector('article')).toBeInTheDocument()
  })

  // cms-api filters by category slug; the entry id matched nothing and silently
  // emptied the rail on every post.
  it('should query related posts by category slug, not entry id', () => {
    render(<PostPage />)

    expect(mockUseGetBlogPostsQuery).toHaveBeenCalledWith(expect.objectContaining({ category: post.category.slug }), expect.anything())
  })

  it('should keep the current post out of the related list', () => {
    const sibling = { ...post, id: 'post-2', slug: 'another-post' }
    mockUseGetBlogPostsQuery.mockReturnValue({ data: { posts: [post, sibling] }, isLoading: false })

    render(<PostPage />)

    expect(mockRelatedPost).toHaveBeenCalledWith(expect.objectContaining({ posts: [sibling] }))
  })

  it('should give both share links an accessible name', () => {
    render(<PostPage />)

    expect(screen.getByRole('link', { name: 'blog.share_on_x' })).toHaveAttribute('href', expect.stringContaining('x.com/intent/post'))
    expect(screen.getByRole('link', { name: 'blog.share_on_facebook' })).toHaveAttribute(
      'href',
      expect.stringContaining('facebook.com/sharer')
    )
  })
})

describe('when the post is still loading', () => {
  beforeEach(() => {
    mockUseAppSelector.mockReturnValue(undefined)
    mockUseGetBlogPostBySlugQuery.mockReturnValue({ data: undefined, isLoading: true, error: undefined })
    mockUseGetBlogPostsQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a progress indicator and no heading', () => {
    render(<PostPage />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })
})

describe('when the post fails to load', () => {
  beforeEach(() => {
    mockUseAppSelector.mockReturnValue(undefined)
    mockUseGetBlogPostBySlugQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') })
    mockUseGetBlogPostsQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the load error copy', () => {
    render(<PostPage />)

    expect(screen.getByText('error.load_post')).toBeInTheDocument()
  })
})

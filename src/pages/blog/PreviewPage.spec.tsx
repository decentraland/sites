import React from 'react'
import { render, screen } from '@testing-library/react'
import type { BlogPost } from '../../shared/blog/types/blog.domain'
import { PreviewPage } from './PreviewPage'

const mockUseGetBlogPostPreviewQuery = jest.fn()
const searchParams = new URLSearchParams({ contentful_id: 'abc', contentful_env: 'master', token: 'preview-token' })

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParams]
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (id: string) => id })
}))

jest.mock('../../components/blog/BlogLayout', () => ({
  BlogLayout: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children)
}))

jest.mock('../../components/blog/RichText', () => ({
  RichText: () => React.createElement('p', null, 'body')
}))

jest.mock('../../features/cms/cms.client', () => ({
  useGetBlogPostPreviewQuery: (...args: unknown[]) => mockUseGetBlogPostPreviewQuery(...args)
}))

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: ({ component, children, ...rest }: { component?: string; children?: React.ReactNode }) =>
      React.createElement(component ?? 'span', rest, children),
    CircularProgress: () => React.createElement('div', { role: 'progressbar' })
  }
})

const post: BlogPost = {
  id: 'post-1',
  slug: 'a-post',
  title: 'A draft post',
  description: 'A standfirst that is not a heading.',
  publishedDate: '2026-09-04T07:00-07:00',
  body: { nodeType: 'document', data: {}, content: [] } as unknown as BlogPost['body'],
  bodyAssets: {},
  image: { id: 'img', url: 'https://cms-images.decentraland.org/a.png', width: 1200, height: 630, mimeType: 'image/png' },
  category: {
    id: 'cat-1',
    slug: 'announcements',
    title: 'Announcements',
    description: '',
    image: { id: 'ci', url: '', width: 0, height: 0, mimeType: '' },
    isShownInMenu: true,
    url: '/blog/announcements'
  },
  author: {
    id: 'author-1',
    slug: 'bay-backner',
    title: 'Bay Backner',
    description: '',
    image: { id: 'ai', url: 'https://cms-images.decentraland.org/author.png', width: 64, height: 64, mimeType: 'image/png' },
    url: '/blog/author/bay-backner'
  },
  url: '/blog/announcements/a-post'
}

describe('when previewing a draft post', () => {
  beforeEach(() => {
    mockUseGetBlogPostPreviewQuery.mockReturnValue({ data: post, isLoading: false, error: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the draft title as the only level-one heading', () => {
    render(<PreviewPage />)

    const headings = screen.getAllByRole('heading', { level: 1 })

    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(post.title)
  })

  it('should render the description as a paragraph rather than a heading', () => {
    render(<PreviewPage />)

    expect(screen.getByText(post.description).tagName).toBe('P')
  })

  it('should wrap the draft in an article landmark with a machine-readable date', () => {
    const { container } = render(<PreviewPage />)

    expect(container.querySelector('article')).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveAttribute('datetime', post.publishedDate)
  })
})

describe('when the preview parameters are incomplete', () => {
  beforeEach(() => {
    searchParams.delete('token')
    mockUseGetBlogPostPreviewQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined })
  })

  afterEach(() => {
    searchParams.set('token', 'preview-token')
    jest.resetAllMocks()
  })

  it('should render the missing-params copy instead of an article', () => {
    const { container } = render(<PreviewPage />)

    expect(screen.getByText('preview.missing_params')).toBeInTheDocument()
    expect(container.querySelector('article')).not.toBeInTheDocument()
  })
})

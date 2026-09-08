import React from 'react'
import { render, screen } from '@testing-library/react'
import type { BlogPost } from '../../../shared/blog/types/blog.domain'
import { MainPostCard } from './MainPostCard'

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode }) => React.createElement('a', { href: to, ...rest }, children)
}))

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: ({ component, children, ...rest }: { component?: string; children?: React.ReactNode }) =>
      React.createElement(component ?? 'span', rest, children),
    Card: actual.Box,
    Skeleton: () => React.createElement('div', { role: 'progressbar' })
  }
})

const post: BlogPost = {
  id: 'post-1',
  slug: 'a-post',
  title: 'A post title',
  description: 'desc',
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
    slug: 'author',
    title: 'Author Name',
    description: '',
    image: { id: 'ai', url: '', width: 0, height: 0, mimeType: '' },
    url: '/blog/author/author'
  },
  url: '/blog/announcements/a-post'
}

describe('when rendering the main post card', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  // The CMS mapper hands over the raw ISO date; formatting is this component's job.
  it('should format the ISO publish date for readers', () => {
    render(<MainPostCard post={post} />)

    expect(screen.getByText('Sep 04, 2026')).toBeInTheDocument()
    expect(screen.queryByText(post.publishedDate)).not.toBeInTheDocument()
  })

  it('should render the title as a level-two heading linking to the post', () => {
    render(<MainPostCard post={post} />)

    const heading = screen.getByRole('heading', { level: 2, name: post.title })

    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', post.url)
  })

  it('should render the description', () => {
    render(<MainPostCard post={post} />)

    expect(screen.getByText(post.description)).toBeInTheDocument()
  })

  it('should render nothing when there is no post', () => {
    const { container } = render(<MainPostCard />)

    expect(container).toBeEmptyDOMElement()
  })
})

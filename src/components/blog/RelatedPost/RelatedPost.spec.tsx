import React from 'react'
import { render, screen } from '@testing-library/react'
import { createBlogPost } from '../../../__test-utils__/blogFixtures'
import { RelatedPost } from './RelatedPost'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (id: string) => id })
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/ui2Mock').createUi2Mock())

jest.mock('../PostCard', () => ({
  PostCard: ({ post }: { post: { title: string } }) => React.createElement('div', { 'data-testid': 'post-card' }, post.title)
}))

const posts = [createBlogPost({ id: 'p1', title: 'First' }), createBlogPost({ id: 'p2', title: 'Second' })]

describe('when rendering the related posts rail', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  // The rail sits after the article's <h1>, so an <h6> here would break the outline.
  it('should title the rail with a level-two heading', () => {
    render(<RelatedPost posts={posts} />)

    expect(screen.getByRole('heading', { level: 2, name: 'blog.related_post' })).toBeInTheDocument()
  })

  it('should cap the rail at the requested number of posts', () => {
    render(<RelatedPost posts={posts} maxItems={1} />)

    expect(screen.getAllByTestId('post-card')).toHaveLength(1)
  })

  it('should render nothing while loading', () => {
    const { container } = render(<RelatedPost posts={posts} loading />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should render nothing when there are no posts', () => {
    const { container } = render(<RelatedPost posts={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

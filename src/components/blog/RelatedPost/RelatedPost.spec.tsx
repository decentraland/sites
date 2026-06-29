import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import type { BlogPost } from '../../../shared/blog/types/blog.domain'
import { makePost } from '../__fixtures__/blog.fixtures'
import { styledMock } from '../__fixtures__/styled-mock'
import { RelatedPost } from './RelatedPost'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children, ...rest }: { children: React.ReactNode }) => <span {...rest}>{children}</span>
}))

jest.mock('../PostCard', () => ({
  PostCard: ({ post }: { post?: { id: string; title: string } }) => <div data-testid={`mock-related-${post?.id}`}>{post?.title}</div>
}))

jest.mock('./RelatedPost.styled', () =>
  styledMock({ RelatedContainer: 'div', RelatedSection: 'section', RelatedTitle: 'h6', RelatedWrapper: 'div' })
)

describe('when rendering RelatedPost', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and loading is true', () => {
    it('should render nothing', () => {
      const { container } = render(
        <MemoryRouter>
          <RelatedPost loading />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('and posts is empty', () => {
    it('should render nothing', () => {
      const { container } = render(
        <MemoryRouter>
          <RelatedPost posts={[]} />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('and posts is provided', () => {
    let posts: BlogPost[]
    beforeEach(() => {
      posts = [
        makePost({ id: 'p1', title: 'First Related' }),
        makePost({ id: 'p2', title: 'Second Related' }),
        makePost({ id: 'p3', title: 'Third Related' }),
        makePost({ id: 'p4', title: 'Fourth Related' })
      ]
    })

    it('should render the related-post translation key as the section title', () => {
      render(
        <MemoryRouter>
          <RelatedPost posts={posts} />
        </MemoryRouter>
      )
      expect(screen.getByText('blog.related_post')).toBeInTheDocument()
    })

    it('should render only the first three posts by default', () => {
      render(
        <MemoryRouter>
          <RelatedPost posts={posts} />
        </MemoryRouter>
      )
      expect(screen.getByTestId('mock-related-p1')).toBeInTheDocument()
      expect(screen.getByTestId('mock-related-p2')).toBeInTheDocument()
      expect(screen.getByTestId('mock-related-p3')).toBeInTheDocument()
      expect(screen.queryByTestId('mock-related-p4')).not.toBeInTheDocument()
    })

    describe('and maxItems is overridden', () => {
      it('should respect the override', () => {
        render(
          <MemoryRouter>
            <RelatedPost posts={posts} maxItems={2} />
          </MemoryRouter>
        )
        expect(screen.getAllByTestId(/^mock-related-/)).toHaveLength(2)
      })
    })
  })
})

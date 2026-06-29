import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import type { PostOrPlaceholder } from '../../../shared/blog/types/blog.domain'
import { makePost } from '../__fixtures__/blog.fixtures'
import { PostList } from './PostList'

jest.mock('decentraland-ui2', () => ({
  useMediaQuery: () => true,
  Typography: ({ children, ...rest }: { children: React.ReactNode }) => <span {...rest}>{children}</span>
}))

jest.mock('../MainPostCard', () => ({
  MainPostCard: ({ post, loading }: { post?: { id: string; title: string }; loading?: boolean }) => (
    <div data-testid={loading ? 'mock-main-card-loading' : 'mock-main-card'}>{post?.title ?? ''}</div>
  )
}))

jest.mock('../PostCard', () => ({
  PostCard: ({ post, loading }: { post?: { id: string; title: string }; loading?: boolean }) => (
    <div data-testid={loading ? 'mock-card-loading' : 'mock-card'}>{post?.title ?? ''}</div>
  )
}))

jest.mock('./PostList.styled', () => ({
  PostListWrapper: ({
    children,
    ...rest
  }: {
    children?: React.ReactNode
    hasMainPost?: boolean
  } & Record<string, unknown>) => {
    // Strip non-DOM props before forwarding
    const { hasMainPost: _omit, ...domProps } = rest as { hasMainPost?: boolean }
    return <div {...(domProps as object)}>{children}</div>
  }
}))

describe('when rendering PostList', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and loading is true with empty posts', () => {
    let posts: PostOrPlaceholder[]
    beforeEach(() => {
      posts = []
    })

    describe('and hasMainPost is true', () => {
      it('should render the skeleton testid', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} loading hasMainPost />
          </MemoryRouter>
        )
        expect(screen.getByTestId('post-list-skeleton')).toBeInTheDocument()
      })

      it('should render one loading main card', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} loading hasMainPost />
          </MemoryRouter>
        )
        expect(screen.getAllByTestId('mock-main-card-loading')).toHaveLength(1)
      })

      it('should render six loading post cards', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} loading hasMainPost />
          </MemoryRouter>
        )
        expect(screen.getAllByTestId('mock-card-loading')).toHaveLength(6)
      })
    })

    describe('and hasMainPost is false', () => {
      it('should render six loading post cards without a main card', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} loading />
          </MemoryRouter>
        )
        expect(screen.getAllByTestId('mock-card-loading')).toHaveLength(6)
        expect(screen.queryByTestId('mock-main-card-loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('and posts is empty and loading is false', () => {
    it('should render nothing', () => {
      const { container } = render(
        <MemoryRouter>
          <PostList posts={[]} />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('and real posts are provided', () => {
    let posts: PostOrPlaceholder[]
    beforeEach(() => {
      posts = [
        makePost({ id: 'p1', title: 'Post One' }),
        makePost({ id: 'p2', title: 'Post Two' }),
        makePost({ id: 'p3', title: 'Post Three' })
      ]
    })

    describe('and hasMainPost is true on a big screen', () => {
      it('should render the post-list testid', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} hasMainPost />
          </MemoryRouter>
        )
        expect(screen.getByTestId('post-list')).toBeInTheDocument()
      })

      it('should render the first post as the main card and skip it in the grid', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} hasMainPost />
          </MemoryRouter>
        )
        expect(screen.getByTestId('mock-main-card')).toHaveTextContent('Post One')
        const gridCards = screen.getAllByTestId('mock-card')
        expect(gridCards).toHaveLength(2)
        expect(gridCards.map(c => c.textContent)).toEqual(['Post Two', 'Post Three'])
      })
    })

    describe('and hasMainPost is false', () => {
      it('should render every post as a grid card without a main card', () => {
        render(
          <MemoryRouter>
            <PostList posts={posts} />
          </MemoryRouter>
        )
        expect(screen.queryByTestId('mock-main-card')).not.toBeInTheDocument()
        expect(screen.getAllByTestId('mock-card')).toHaveLength(3)
      })
    })
  })

  describe('and posts mix placeholders with real posts', () => {
    let posts: PostOrPlaceholder[]
    beforeEach(() => {
      posts = [makePost({ id: 'p1', title: 'Real Post' }), { id: 'placeholder-1', isPlaceholder: true }]
    })

    it('should render placeholders as loading cards', () => {
      render(
        <MemoryRouter>
          <PostList posts={posts} />
        </MemoryRouter>
      )
      expect(screen.getAllByTestId('mock-card-loading')).toHaveLength(1)
      expect(screen.getAllByTestId('mock-card')).toHaveLength(1)
    })
  })
})

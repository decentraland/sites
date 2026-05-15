import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import type { BlogPost } from '../../../shared/blog/types/blog.domain'
import { makePost } from '../__fixtures__/blog.fixtures'
import { PostCard } from './PostCard'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children, ...rest }: { children: React.ReactNode }) => <span {...rest}>{children}</span>
}))

jest.mock('./PostCard.styled', () => {
  const passThrough =
    (tag: keyof JSX.IntrinsicElements) =>
    ({ children, to, ...rest }: { children?: React.ReactNode; to?: string } & Record<string, unknown>) => {
      const Tag = tag
      const props = to !== undefined ? { ...rest, href: to } : rest
      return <Tag {...(props as object)}>{children}</Tag>
    }
  return {
    CardContainer: passThrough('div'),
    CardImage: passThrough('img'),
    CardImageLink: passThrough('a'),
    CardInfo: passThrough('div'),
    CategoryLink: passThrough('a'),
    DateText: passThrough('span'),
    LoadingHeader: passThrough('div'),
    LoadingImage: passThrough('div'),
    LoadingMetaSkeleton: passThrough('div'),
    LoadingTextSkeleton: passThrough('div'),
    LoadingTextSkeletonShort: passThrough('div'),
    MetaBox: passThrough('div'),
    TitleLink: passThrough('a')
  }
})

describe('when rendering PostCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the loading prop is true', () => {
    it('should render the skeleton testid', () => {
      render(
        <MemoryRouter>
          <PostCard loading />
        </MemoryRouter>
      )
      expect(screen.getByTestId('post-card-skeleton')).toBeInTheDocument()
    })
  })

  describe('and a post is provided', () => {
    let post: BlogPost
    beforeEach(() => {
      post = makePost({ title: 'Hello World', url: '/blog/announcements/hello-world' })
    })

    it('should render the post card testid', () => {
      render(
        <MemoryRouter>
          <PostCard post={post} />
        </MemoryRouter>
      )
      expect(screen.getByTestId('post-card')).toBeInTheDocument()
    })

    it('should render the post title text', () => {
      render(
        <MemoryRouter>
          <PostCard post={post} />
        </MemoryRouter>
      )
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('should link the image and title to the post url', () => {
      render(
        <MemoryRouter>
          <PostCard post={post} />
        </MemoryRouter>
      )
      const postLinks = screen.getAllByRole('link').filter(a => a.getAttribute('href') === post.url)
      expect(postLinks.length).toBeGreaterThanOrEqual(2)
    })

    it('should link the category to its url', () => {
      render(
        <MemoryRouter>
          <PostCard post={post} />
        </MemoryRouter>
      )
      const categoryLink = screen.getByRole('link', { name: post.category.title })
      expect(categoryLink).toHaveAttribute('href', post.category.url)
    })

    it('should render the post image with the title as alt text', () => {
      render(
        <MemoryRouter>
          <PostCard post={post} />
        </MemoryRouter>
      )
      const img = screen.getByRole('img', { name: post.title })
      expect(img).toHaveAttribute('src', post.image.url)
    })
  })

  describe('and no post is provided and loading is false', () => {
    it('should render nothing', () => {
      const { container } = render(
        <MemoryRouter>
          <PostCard />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })
})

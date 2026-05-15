import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import type { BlogPost } from '../../../shared/blog/types/blog.domain'
import { makePost } from '../__fixtures__/blog.fixtures'
import { styledMock } from '../__fixtures__/styled-mock'
import { MainPostCard } from './MainPostCard'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
  Typography: ({ children, ...rest }: { children: React.ReactNode }) => <span {...rest}>{children}</span>
}))

jest.mock('./MainPostCard.styled', () =>
  styledMock({
    CardContainer: 'div',
    CardImage: 'img',
    CardImageLink: 'a',
    CardInfo: 'div',
    CategoryLink: 'a',
    DateText: 'span',
    Description: 'p',
    LoadingContentBox: 'div',
    LoadingHeader: 'div',
    LoadingImage: 'div',
    LoadingMetaSkeleton: 'div',
    LoadingTextSkeleton: 'div',
    LoadingTextSkeletonShort: 'div',
    LoadingTitleLine: 'div',
    LoadingTitleLineShort: 'div',
    MetaBox: 'div',
    TitleLink: 'a'
  })
)

describe('when rendering MainPostCard', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the loading prop is true', () => {
    it('should render the skeleton testid', () => {
      render(
        <MemoryRouter>
          <MainPostCard loading />
        </MemoryRouter>
      )
      expect(screen.getByTestId('main-post-card-skeleton')).toBeInTheDocument()
    })
  })

  describe('and a post is provided', () => {
    let post: BlogPost
    beforeEach(() => {
      post = makePost({ title: 'Featured Title', description: 'Featured description.' })
    })

    it('should render the main post card testid', () => {
      render(
        <MemoryRouter>
          <MainPostCard post={post} />
        </MemoryRouter>
      )
      expect(screen.getByTestId('main-post-card')).toBeInTheDocument()
    })

    it('should render the post title and description', () => {
      render(
        <MemoryRouter>
          <MainPostCard post={post} />
        </MemoryRouter>
      )
      expect(screen.getByText('Featured Title')).toBeInTheDocument()
      expect(screen.getByText('Featured description.')).toBeInTheDocument()
    })

    it('should link the title to the post url', () => {
      render(
        <MemoryRouter>
          <MainPostCard post={post} />
        </MemoryRouter>
      )
      const links = screen.getAllByRole('link').filter(a => a.getAttribute('href') === post.url)
      expect(links.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('and no post is provided and loading is false', () => {
    it('should render nothing', () => {
      const { container } = render(
        <MemoryRouter>
          <MainPostCard />
        </MemoryRouter>
      )
      expect(container.firstChild).toBeNull()
    })
  })
})

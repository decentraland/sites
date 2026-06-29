import { render, screen } from '@testing-library/react'
import { styledMock } from './__fixtures__/styled-mock'
import { BlogLayout } from './BlogLayout'

jest.mock('./BlogNavigation/BlogNavigation', () => ({
  BlogNavigation: ({ active }: { active?: string }) => <nav data-testid="mock-blog-navigation">{active ?? ''}</nav>
}))

jest.mock('./BlogLayout.styled', () => styledMock({ BlogContentWrapper: 'main', BlogLayoutContainer: 'div' }))

describe('when rendering BlogLayout', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and showBlogNavigation defaults to true', () => {
    it('should render the BlogNavigation by default', () => {
      render(
        <BlogLayout>
          <span>child</span>
        </BlogLayout>
      )
      expect(screen.getByTestId('mock-blog-navigation')).toBeInTheDocument()
    })

    it('should forward the activeCategory prop to BlogNavigation', () => {
      render(
        <BlogLayout activeCategory="announcements">
          <span>child</span>
        </BlogLayout>
      )
      expect(screen.getByTestId('mock-blog-navigation')).toHaveTextContent('announcements')
    })
  })

  describe('and showBlogNavigation is false', () => {
    it('should hide the BlogNavigation', () => {
      render(
        <BlogLayout showBlogNavigation={false}>
          <span>child</span>
        </BlogLayout>
      )
      expect(screen.queryByTestId('mock-blog-navigation')).not.toBeInTheDocument()
    })
  })

  describe('and a banner is provided', () => {
    it('should render the banner above the main content', () => {
      render(
        <BlogLayout banner={<header data-testid="banner-slot">banner</header>}>
          <span>child</span>
        </BlogLayout>
      )
      expect(screen.getByTestId('banner-slot')).toBeInTheDocument()
    })
  })

  describe('and relatedPosts are provided', () => {
    it('should render them after the main content', () => {
      render(
        <BlogLayout relatedPosts={<aside data-testid="related-slot">related</aside>}>
          <span>child</span>
        </BlogLayout>
      )
      expect(screen.getByTestId('related-slot')).toBeInTheDocument()
    })
  })

  describe('and children are provided', () => {
    it('should render them inside the main wrapper', () => {
      render(
        <BlogLayout>
          <span data-testid="child-slot">child</span>
        </BlogLayout>
      )
      expect(screen.getByTestId('child-slot')).toBeInTheDocument()
    })
  })
})

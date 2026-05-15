import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import type { BlogCategory } from '../../../shared/blog/types/blog.domain'
import { makeCategory } from '../__fixtures__/blog.fixtures'
import { styledMock } from '../__fixtures__/styled-mock'
import { BlogNavigation } from './BlogNavigation'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const mockUseGetBlogCategoriesQuery = jest.fn()
jest.mock('../../../features/cms/cms.client', () => ({
  useGetBlogCategoriesQuery: () => mockUseGetBlogCategoriesQuery()
}))

jest.mock('../Search', () => ({
  Search: () => <div data-testid="mock-search" />
}))

jest.mock('./BlogNavigation.styled', () => {
  const stubs = styledMock({
    NavbarContent: 'div',
    NavbarWrapper: 'div',
    NavbarCategories: 'div',
    CategoryList: 'ul',
    CategoryItem: 'li'
  })
  return {
    ...stubs,
    NavbarContainer: ({ children, ...rest }: { children?: React.ReactNode; $embedded?: boolean } & Record<string, unknown>) => {
      const { $embedded: _e, ...domProps } = rest as { $embedded?: boolean }
      return <nav {...(domProps as object)}>{children}</nav>
    },
    CategoryLink: ({ children, to, ...rest }: { children?: React.ReactNode; to: string; $active?: boolean } & Record<string, unknown>) => {
      const { $active, ...domProps } = rest as { $active?: boolean }
      return (
        <a href={to} aria-current={$active ? 'page' : undefined} {...(domProps as object)}>
          {children}
        </a>
      )
    }
  }
})

describe('when rendering BlogNavigation', () => {
  let categories: BlogCategory[]

  beforeEach(() => {
    categories = [
      makeCategory({ id: 'cat-a', slug: 'announcements', title: 'Announcements', isShownInMenu: true }),
      makeCategory({ id: 'cat-b', slug: 'events', title: 'Events', isShownInMenu: true }),
      makeCategory({ id: 'cat-hidden', slug: 'hidden', title: 'Hidden', isShownInMenu: false })
    ]
    mockUseGetBlogCategoriesQuery.mockReturnValue({ data: categories })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and there is no active category', () => {
    it('should render the all-articles link and visible categories', () => {
      render(
        <MemoryRouter>
          <BlogNavigation />
        </MemoryRouter>
      )
      expect(screen.getByRole('link', { name: 'blog.all_articles' })).toHaveAttribute('href', '/blog')
      expect(screen.getByRole('link', { name: 'Announcements' })).toHaveAttribute('href', '/blog/announcements')
      expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute('href', '/blog/events')
    })

    it('should hide categories whose isShownInMenu is false', () => {
      render(
        <MemoryRouter>
          <BlogNavigation />
        </MemoryRouter>
      )
      expect(screen.queryByRole('link', { name: 'Hidden' })).not.toBeInTheDocument()
    })
  })

  describe('and the active prop is all_articles', () => {
    it('should mark the all-articles link as the current page', () => {
      render(
        <MemoryRouter>
          <BlogNavigation active="all_articles" />
        </MemoryRouter>
      )
      expect(screen.getByRole('link', { name: 'blog.all_articles' })).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('and the active prop matches a category slug', () => {
    it('should mark that category link as the current page', () => {
      render(
        <MemoryRouter>
          <BlogNavigation active="announcements" />
        </MemoryRouter>
      )
      expect(screen.getByRole('link', { name: 'Announcements' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Events' })).not.toHaveAttribute('aria-current', 'page')
    })
  })

  describe('and the categories query returns undefined', () => {
    beforeEach(() => {
      mockUseGetBlogCategoriesQuery.mockReturnValue({ data: undefined })
    })

    it('should render the all-articles link without crashing', () => {
      render(
        <MemoryRouter>
          <BlogNavigation />
        </MemoryRouter>
      )
      expect(screen.getByRole('link', { name: 'blog.all_articles' })).toBeInTheDocument()
    })
  })

  it('should render the embedded Search component', () => {
    render(
      <MemoryRouter>
        <BlogNavigation />
      </MemoryRouter>
    )
    expect(screen.getByTestId('mock-search')).toBeInTheDocument()
  })
})

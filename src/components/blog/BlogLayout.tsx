import type { ReactNode } from 'react'
import { BlogNavigation } from './BlogNavigation/BlogNavigation'
import { BlogContentWrapper, BlogLayoutContainer } from './BlogLayout.styled'

interface BlogLayoutProps {
  children: ReactNode
  activeCategory?: string
  banner?: ReactNode
  showBlogNavigation?: boolean
  relatedPosts?: ReactNode
}

function BlogLayout({ children, activeCategory, banner, showBlogNavigation = true, relatedPosts }: BlogLayoutProps) {
  return (
    <BlogLayoutContainer>
      {showBlogNavigation && <BlogNavigation active={activeCategory} />}
      {banner}
      <BlogContentWrapper component="main">{children}</BlogContentWrapper>
      {relatedPosts}
    </BlogLayoutContainer>
  )
}

export { BlogLayout }

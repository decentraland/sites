import { useMemo } from 'react'
import { useTranslation } from '@dcl/hooks'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { Typography } from 'decentraland-ui2'
import { BlogLayout } from '../../components/blog/BlogLayout'
import { PostList } from '../../components/blog/PostList'
import { SEO } from '../../components/blog/SEO/SEO'
import { useInfiniteBlogPosts } from '../../features/cms/useInfiniteBlogPosts'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import type { BlogPost } from '../../shared/blog/types/blog.domain'
import { ErrorContainer } from './BlogPage.styled'

export const BlogPage = () => {
  const { t } = useTranslation()
  const isMobile = useMobileMediaQuery()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts()
  const blogTitle = t('blog.title')
  useBlogPageTracking({
    name: blogTitle,
    properties: { title: blogTitle, path: '/blog' }
  })

  const firstPost = useMemo(() => {
    const post = posts.find((p): p is BlogPost => !('isPlaceholder' in p))
    return post
  }, [posts])

  return (
    <BlogLayout showBlogNavigation activeCategory="all_articles">
      <SEO
        title={t('blog.title')}
        description={firstPost?.description || t('blog.default_description')}
        image={
          firstPost?.image
            ? {
                url: firstPost.image.url,
                width: firstPost.image.width,
                height: firstPost.image.height,
                alt: firstPost.title
              }
            : undefined
        }
      />
      {error ? (
        <ErrorContainer>
          <Typography color="error">{t('error.load_posts')}</Typography>
        </ErrorContainer>
      ) : (
        <PostList posts={posts} loading={isLoadingInitial} hasMainPost={!isMobile} />
      )}
    </BlogLayout>
  )
}

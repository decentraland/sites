import { useParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { BlogLayout } from '../../components/blog/BlogLayout'
import { CategoryHero } from '../../components/blog/CategoryHero'
import { PostList } from '../../components/blog/PostList'
import { SEO } from '../../components/blog/SEO/SEO'
import { getEnv } from '../../config/env'
import { useGetBlogCategoryBySlugQuery } from '../../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../../features/blog/useInfiniteBlogPosts'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import type { BlogCategory } from '../../shared/blog/types/blog.domain'
import { CenteredBox } from './shared.styled'

const CategoryPostList = ({ category }: { category: BlogCategory }) => {
  const { t } = useTranslation()
  const isMobile = useMobileMediaQuery()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts({
    category: category.slug
  })

  if (error) {
    return (
      <CenteredBox>
        <Typography color="error">{t('error.load_posts')}</Typography>
      </CenteredBox>
    )
  }

  return <PostList posts={posts} loading={isLoadingInitial} hasMainPost={!isMobile} />
}

export const CategoryPage = () => {
  const { t } = useTranslation()
  const { categorySlug } = useParams<{ categorySlug: string }>()

  const {
    data: category,
    isLoading: isCategoryLoading,
    error: categoryError
  } = useGetBlogCategoryBySlugQuery({
    slug: categorySlug || ''
  })

  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  useBlogPageTracking({
    name: category?.title,
    properties: category ? { title: category.title, categorySlug: category.slug } : undefined
  })

  if (categoryError) {
    return (
      <BlogLayout showBlogNavigation={true} activeCategory={categorySlug}>
        <CenteredBox>
          <Typography color="error">{t('error.load_category')}</Typography>
        </CenteredBox>
      </BlogLayout>
    )
  }

  return (
    <BlogLayout
      showBlogNavigation={true}
      activeCategory={categorySlug}
      banner={
        category ? <CategoryHero category={category.title} description={category.description} image={category.image.url} /> : undefined
      }
    >
      <SEO
        title={category?.title}
        description={category?.description || t('blog.default_description')}
        url={`${baseUrl}/${categorySlug}`}
        image={
          category?.image
            ? {
                url: category.image.url,
                width: category.image.width,
                height: category.image.height,
                alt: category.title
              }
            : undefined
        }
      />
      {isCategoryLoading ? (
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      ) : category ? (
        // key forces remount when category changes, resetting the infinite scroll hook
        <CategoryPostList key={category.id} category={category} />
      ) : null}
    </BlogLayout>
  )
}

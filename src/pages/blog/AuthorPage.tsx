import { useParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { BlogLayout } from '../../components/blog/BlogLayout'
import { PostList } from '../../components/blog/PostList'
import { OGType, SEO } from '../../components/blog/SEO/SEO'
import { getEnv } from '../../config/env'
import { useGetBlogAuthorBySlugQuery } from '../../features/blog/blog.client'
import { useInfiniteBlogPosts } from '../../features/blog/useInfiniteBlogPosts'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import type { BlogAuthor } from '../../shared/blog/types/blog.domain'
import { AuthorHeaderBox, AuthorImage } from './AuthorPage.styled'
import { CenteredBox } from './shared.styled'

const AuthorPostList = ({ author }: { author: BlogAuthor }) => {
  const { t } = useTranslation()
  const { posts, isLoadingInitial, error } = useInfiniteBlogPosts({
    author: author.slug
  })

  if (error) {
    return (
      <CenteredBox>
        <Typography color="error">{t('error.load_posts')}</Typography>
      </CenteredBox>
    )
  }

  return (
    <>
      <AuthorHeaderBox>
        {author.image && <AuthorImage src={author.image.url} alt={author.title} />}

        <Typography variant="h5">{author.title}</Typography>
        <Typography variant="body1" color="textSecondary">
          {author.description}
        </Typography>
      </AuthorHeaderBox>

      <PostList posts={posts} loading={isLoadingInitial} hasMainPost={false} />
    </>
  )
}

export const AuthorPage = () => {
  const { t } = useTranslation()
  const { authorSlug } = useParams<{ authorSlug: string }>()

  const {
    data: author,
    isLoading: isAuthorLoading,
    error: authorError
  } = useGetBlogAuthorBySlugQuery({
    slug: authorSlug || ''
  })

  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  const pageTitle = author?.title ? t('blog.posts_by', { author: author.title }) : undefined
  useBlogPageTracking({
    name: pageTitle,
    properties: author
      ? {
          title: pageTitle,
          author: author.title,
          authorSlug: author.slug
        }
      : undefined
  })

  if (authorError) {
    return (
      <BlogLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">{t('error.load_author')}</Typography>
        </CenteredBox>
      </BlogLayout>
    )
  }

  return (
    <BlogLayout showBlogNavigation={true}>
      <SEO
        title={pageTitle}
        description={author?.description || t('blog.default_description')}
        url={`${baseUrl}/author/${authorSlug}`}
        type={OGType.PROFILE}
        image={
          author?.image
            ? {
                url: author.image.url,
                alt: author.title
              }
            : undefined
        }
      />
      {isAuthorLoading ? (
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      ) : author ? (
        // key forces remount when author changes, resetting the infinite scroll hook
        <AuthorPostList key={author.id} author={author} />
      ) : null}
    </BlogLayout>
  )
}

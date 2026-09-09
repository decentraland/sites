import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import FacebookIcon from '@mui/icons-material/Facebook'
// eslint-disable-next-line @typescript-eslint/naming-convention
import XIcon from '@mui/icons-material/X'
import { useTranslation } from '@dcl/hooks'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { BlogLayout } from '../../components/blog/BlogLayout'
import { PostHeader } from '../../components/blog/PostHeader'
import { RelatedPost } from '../../components/blog/RelatedPost'
import { RichText } from '../../components/blog/RichText'
import { OGType, SEO } from '../../components/blog/SEO/SEO'
import { getEnv } from '../../config/env'
import { useGetBlogPostBySlugQuery, useGetBlogPostsQuery } from '../../features/cms/cms.client'
import { selectPostByCategoryAndSlug } from '../../features/cms/cms.selectors'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'
import { locations } from '../../shared/blog/utils/locations'
import { useAppSelector } from '../../shells/store'
import {
  AuthorAvatar,
  AuthorBox,
  AuthorLink,
  AuthorName,
  AuthorRow,
  BodyContainer,
  CategoryMetaLink,
  CenteredBox,
  ContentContainer,
  PostImage,
  ShareContainer,
  ShareLabel,
  ShareLink
} from './PostPage.styled'

const RELATED_POSTS_COUNT = 3
// One spare row so filtering out the post being read still leaves a full rail.
const RELATED_POSTS_FETCH_LIMIT = RELATED_POSTS_COUNT + 1

export const PostPage = () => {
  const { t } = useTranslation()
  const { categorySlug, postSlug } = useParams<{ categorySlug: string; postSlug: string }>()

  // Look up the post from the normalized entity store (populated by onQueryStarted after any list fetch)
  const cachedPost = useAppSelector(state => selectPostByCategoryAndSlug(state, categorySlug ?? '', postSlug ?? ''))

  // Only fetch if not in cache
  const {
    data: post,
    isLoading,
    error
  } = useGetBlogPostBySlugQuery(
    {
      categorySlug: categorySlug || '',
      postSlug: postSlug || ''
    },
    {
      skip: !!cachedPost
    }
  )

  // Use cached post if available, otherwise use fetched post
  const displayPost = useMemo(() => cachedPost || post, [cachedPost, post])

  const { data: relatedPostsData, isLoading: isRelatedPostsLoading } = useGetBlogPostsQuery(
    {
      category: displayPost?.category.slug,
      limit: RELATED_POSTS_FETCH_LIMIT,
      skip: 0
    },
    {
      skip: !displayPost?.category.slug
    }
  )

  const relatedPosts = useMemo(() => {
    if (!relatedPostsData?.posts || !displayPost) {
      return []
    }

    return relatedPostsData.posts.filter(postItem => postItem.id !== displayPost.id)
  }, [displayPost, relatedPostsData?.posts])

  const author = displayPost?.author
  const showAuthor = !!author && !!author.title

  const baseUrl = getEnv('BLOG_BASE_URL') || ''

  usePageViewTracking({
    name: displayPost?.title,
    properties: displayPost
      ? {
          title: displayPost.title,
          slug: displayPost.slug,
          category: displayPost.category.title,
          categorySlug: displayPost.category.slug,
          author: displayPost.author?.title,
          authorSlug: displayPost.author?.slug,
          // NOTE: 2026-09-08 — this property now carries the raw ISO 8601 date. It used to
          // send the display string ("Sep 04, 2026") because the CMS mapper formatted it
          // before the domain model saw it. Warehouse queries keyed on the old format need
          // updating; the format is not going back.
          publishedDate: displayPost.publishedDate
        }
      : undefined
  })

  if (isLoading && !cachedPost) {
    return (
      <BlogLayout showBlogNavigation activeCategory={categorySlug}>
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      </BlogLayout>
    )
  }

  if (error || !displayPost) {
    return (
      <BlogLayout showBlogNavigation activeCategory={categorySlug}>
        <CenteredBox>
          <Typography color="error">{t('error.load_post')}</Typography>
        </CenteredBox>
      </BlogLayout>
    )
  }

  return (
    <BlogLayout
      showBlogNavigation
      activeCategory={categorySlug}
      relatedPosts={<RelatedPost posts={relatedPosts} loading={isRelatedPostsLoading} maxItems={RELATED_POSTS_COUNT} />}
    >
      <SEO
        title={displayPost?.title}
        description={displayPost?.description || t('blog.default_description')}
        url={displayPost ? `${baseUrl}/${categorySlug}/${postSlug}` : baseUrl}
        type={OGType.ARTICLE}
        image={
          displayPost?.image
            ? {
                url: displayPost.image.url,
                width: displayPost.image.width,
                height: displayPost.image.height,
                alt: displayPost.title
              }
            : undefined
        }
        author={author?.title}
        publishedTime={displayPost?.publishedDate}
        section={displayPost?.category.title}
        tags={displayPost?.category.title ? [displayPost.category.title] : undefined}
      />
      <ContentContainer>
        <PostImage
          src={displayPost.image.url}
          alt={displayPost.title}
          width={displayPost.image.width}
          height={displayPost.image.height}
          fetchPriority="high"
          decoding="async"
        />

        <PostHeader
          title={displayPost.title}
          description={displayPost.description}
          publishedDate={displayPost.publishedDate}
          category={<CategoryMetaLink to={locations.category(displayPost.category.slug)}>{displayPost.category.title}</CategoryMetaLink>}
        />

        {showAuthor && (
          <AuthorRow>
            <AuthorBox>
              <AuthorLink to={author.url}>
                {author.image?.url && <AuthorAvatar src={author.image.url} alt={author.title} loading="lazy" decoding="async" />}
                <AuthorName variant="body2">{author.title}</AuthorName>
              </AuthorLink>
            </AuthorBox>
            <ShareContainer>
              <ShareLabel>{t('blog.share')}</ShareLabel>
              <ShareLink href={locations.twitter(displayPost)} target="_blank" rel="noopener noreferrer" aria-label={t('blog.share_on_x')}>
                <XIcon fontSize="small" />
              </ShareLink>
              <ShareLink
                href={locations.facebook(displayPost)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('blog.share_on_facebook')}
              >
                <FacebookIcon fontSize="small" />
              </ShareLink>
            </ShareContainer>
          </AuthorRow>
        )}

        <BodyContainer>
          <RichText document={displayPost.body} assets={displayPost.bodyAssets} />
        </BodyContainer>
      </ContentContainer>
    </BlogLayout>
  )
}

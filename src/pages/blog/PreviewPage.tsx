import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '@dcl/hooks'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { BlogLayout } from '../../components/blog/BlogLayout'
import { RichText } from '../../components/blog/RichText'
import { useGetBlogPostPreviewQuery } from '../../features/blog/blog.client'
import { formatUtcDate } from '../../shared/blog/utils/date'
import {
  AuthorAvatar,
  AuthorBox,
  AuthorName,
  BodyContainer,
  CenteredBox,
  ContentContainer,
  HeaderBox,
  MetaSeparator,
  MetaText,
  PostImage,
  SubtitleText,
  TitleBox,
  TitleText
} from './PostPage.styled'
import { AuthorContainer, CategoryText, PreviewBanner } from './PreviewPage.styled'

const CONTENTFUL_PREVIEW_URL = 'https://preview.contentful.com'
const CONTENTFUL_SPACE_ID = 'ea2ybdmmn1kv'

export const PreviewPage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const previewOptions = useMemo(
    () => ({
      id: searchParams.get('contentful_id') ?? '',
      env: searchParams.get('contentful_env') ?? '',
      token: searchParams.get('token') ?? '',
      previewBaseUrl: CONTENTFUL_PREVIEW_URL,
      spaceId: CONTENTFUL_SPACE_ID
    }),
    [searchParams]
  )

  const isValidParams = previewOptions.id && previewOptions.env && previewOptions.token

  const { data: post, isLoading, error } = useGetBlogPostPreviewQuery(previewOptions, { skip: !isValidParams })

  const publishedDateUtc = useMemo(() => formatUtcDate(post?.publishedDate), [post?.publishedDate])
  const author = post?.author
  const showAuthor = !!author && !!author.title

  if (!isValidParams) {
    return (
      <BlogLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">{t('preview.missing_params')}</Typography>
        </CenteredBox>
      </BlogLayout>
    )
  }

  if (isLoading) {
    return (
      <BlogLayout showBlogNavigation={true}>
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      </BlogLayout>
    )
  }

  if (error || !post) {
    return (
      <BlogLayout showBlogNavigation={true}>
        <CenteredBox>
          <Typography color="error">{t('error.load_preview')}</Typography>
        </CenteredBox>
      </BlogLayout>
    )
  }

  return (
    <BlogLayout showBlogNavigation={true}>
      <PreviewBanner>
        <Typography variant="h6">{t('preview.mode')}</Typography>
        <Typography variant="body2">{t('preview.description')}</Typography>
      </PreviewBanner>

      <ContentContainer>
        <PostImage src={post.image.url} alt={post.title} />

        <HeaderBox>
          <MetaText as="span">
            {publishedDateUtc}
            <MetaSeparator>•</MetaSeparator>
            <CategoryText>{post.category.title}</CategoryText>
          </MetaText>
          <TitleBox>
            <TitleText variant="h4">{post.title}</TitleText>
          </TitleBox>
          <SubtitleText variant="h6">{post.description}</SubtitleText>
        </HeaderBox>

        {showAuthor && (
          <AuthorBox>
            <AuthorContainer>
              {author.image?.url && <AuthorAvatar src={author.image.url} alt={author.title} />}
              <AuthorName variant="body2">{author.title}</AuthorName>
            </AuthorContainer>
          </AuthorBox>
        )}

        <BodyContainer>
          <RichText document={post.body} assets={post.bodyAssets} />
        </BodyContainer>
      </ContentContainer>
    </BlogLayout>
  )
}

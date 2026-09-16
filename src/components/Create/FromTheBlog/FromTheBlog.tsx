import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useGetLatestBlogPostsQuery } from '../../../features/cms/cms.discovery'
import { formatPostDate } from '../../../features/cms/cms.discovery.helpers'
import type { LatestPost } from '../../../features/cms/cms.discovery.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { AnimatedSection } from '../AnimatedSection'
import {
  BlogCard,
  BlogCardCategory,
  BlogCardDate,
  BlogCardImage,
  BlogCardInfo,
  BlogCardMeta,
  BlogCardTitle,
  BlogCardsContainer,
  BlogSection,
  BlogTitle,
  BlogViewAllLink
} from './FromTheBlog.styled'

type BlogPostCardProps = {
  post: LatestPost
}

const BlogPostCard = memo(({ post }: BlogPostCardProps) => {
  const trackClick = useTrackClick()
  return (
    <BlogCard
      to={post.url}
      onClick={trackClick}
      data-place={SectionViewedTrack.CREATORS_BLOG}
      data-event={SegmentEvent.CLICK}
      data-title={post.title}
    >
      <BlogCardImage>{post.imageUrl ? <img src={post.imageUrl} alt={post.title} loading="lazy" /> : null}</BlogCardImage>
      <BlogCardInfo>
        <BlogCardMeta>
          {post.categoryTitle ? <BlogCardCategory>{post.categoryTitle}</BlogCardCategory> : null}
          <BlogCardDate>{formatPostDate(post.publishedDate)}</BlogCardDate>
        </BlogCardMeta>
        <BlogCardTitle>{post.title}</BlogCardTitle>
      </BlogCardInfo>
    </BlogCard>
  )
})

const CreatorsBlog = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const { data: posts, isLoading } = useGetLatestBlogPostsQuery()

  if (isLoading || posts.length === 0) return null

  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_BLOG}>
      <BlogSection>
        <BlogTitle>
          <span>{l('component.creators_landing.blog.title_highlight')}</span> {l('component.creators_landing.blog.title')}
        </BlogTitle>
        <BlogCardsContainer>
          {posts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </BlogCardsContainer>
        <BlogViewAllLink
          to="/blog"
          onClick={trackClick}
          data-place={SectionViewedTrack.CREATORS_BLOG}
          data-event={SegmentEvent.CLICK}
          data-title="view-all"
        >
          {l('component.creators_landing.blog.view_all')}
          <ChevronRightIcon />
        </BlogViewAllLink>
      </BlogSection>
    </AnimatedSection>
  )
})

export { CreatorsBlog }

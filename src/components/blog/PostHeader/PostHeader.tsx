import { formatUtcDate } from '../../../shared/blog/utils/date'
import type { PostHeaderProps } from './PostHeader.types'
import { HeaderBox, MetaSeparator, MetaText, SubtitleText, TitleBox, TitleText } from './PostHeader.styled'

const PostHeader = (props: PostHeaderProps) => {
  const { title, description, publishedDate, category } = props
  const publishedDateUtc = formatUtcDate(publishedDate)

  return (
    <HeaderBox>
      <MetaText as="span">
        {/* An empty `datetime` is invalid HTML, so a dateless post drops the element
            and its separator rather than rendering `<time datetime="">`. */}
        {publishedDateUtc && (
          <>
            <time dateTime={publishedDate}>{publishedDateUtc}</time>
            <MetaSeparator>•</MetaSeparator>
          </>
        )}
        {category}
      </MetaText>
      <TitleBox>
        <TitleText variant="h4" component="h1">
          {title}
        </TitleText>
      </TitleBox>
      <SubtitleText variant="h6" component="p">
        {description}
      </SubtitleText>
    </HeaderBox>
  )
}

export { PostHeader }

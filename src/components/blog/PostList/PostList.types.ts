import type { PostOrPlaceholder } from '../../../shared/blog/types/blog.domain'

export interface PostListProps {
  posts: PostOrPlaceholder[]
  loading?: boolean
  hasMainPost?: boolean
}

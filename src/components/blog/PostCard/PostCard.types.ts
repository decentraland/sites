import type { BlogPost } from '../../../shared/blog/types/blog.domain'

export interface PostCardProps {
  post?: BlogPost
  loading?: boolean
}

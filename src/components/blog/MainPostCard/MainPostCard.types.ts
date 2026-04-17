import type { BlogPost } from '../../../shared/blog/types/blog.domain'

export interface MainPostCardProps {
  post?: BlogPost
  loading?: boolean
}

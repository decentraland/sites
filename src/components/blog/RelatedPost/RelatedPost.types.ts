import type { BlogPost } from '../../../shared/blog/types/blog.domain'

export interface RelatedPostProps {
  posts?: BlogPost[]
  loading?: boolean
  maxItems?: number
}

import type { ReactNode } from 'react'

export interface PostHeaderProps {
  title: string
  description: string
  /** Raw ISO 8601 value. Rendered as the `datetime` attribute and formatted for readers. */
  publishedDate: string
  /** The category label. A router link on the live post, plain text in preview. */
  category: ReactNode
}

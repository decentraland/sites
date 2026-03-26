import type { ReactNode } from 'react'

interface TOCEntry {
  id: string
  label: string
  depth?: number
}

interface LegalPageLayoutProps {
  title: string
  activeSlug: string
  tableOfContents: TOCEntry[]
  children: ReactNode
}

export type { LegalPageLayoutProps, TOCEntry }

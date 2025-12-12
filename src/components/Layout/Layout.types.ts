import type { ReactNode } from 'react'

interface LayoutProps {
  children?: ReactNode
  activePage?: string
  withNavbar?: boolean
  withFooter?: boolean
}

export type { LayoutProps }

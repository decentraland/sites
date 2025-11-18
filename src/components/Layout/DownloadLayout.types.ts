import type { AdvancedNavigatorUAData } from '@dcl/hooks'

type DownloadLayoutProps = {
  productName: string
  userAgentData: AdvancedNavigatorUAData | undefined
  links: Record<string, Record<string, string>>
  title: string
  image: string
  redirectPath?: string
  imageObjectFit?: 'cover' | 'contain'
}

export type { DownloadLayoutProps }

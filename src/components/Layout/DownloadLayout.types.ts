import type { AdvancedNavigatorUAData } from '@dcl/hooks'

type DownloadLayoutProps = {
  userAgentData: AdvancedNavigatorUAData | undefined
  links: Record<string, Record<string, string>>
  title: string
  redirectPath?: string
}

export type { DownloadLayoutProps }

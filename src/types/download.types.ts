import type { AdvancedNavigatorUAData } from '@dcl/hooks'

enum OperativeSystem {
  WINDOWS = 'Windows',
  MACOS = 'macOS'
}

type DownloadLinkProps = Record<OperativeSystem, Record<string, string>>

type DownloadOptionsProps = {
  userAgentData: AdvancedNavigatorUAData | undefined
  links: Record<string, Record<string, string>>
  hideLogo?: boolean
  title?: string
  label?: string
  redirectPath?: string
  logoVariant?: 'colored' | 'white'
  downloadCounts?: string | boolean
}

type Architecture = 'amd64' | 'arm64' | 'x64'

type DownloadOptionProps = {
  text: string
  image: string
  link?: string
  redirectOs?: string
  arch?: Architecture
  archInfo?: string
}

export type { Architecture, DownloadLinkProps, DownloadOptionProps, DownloadOptionsProps }
export { OperativeSystem }

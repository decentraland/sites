import type { ReactNode } from 'react'
import type { Architecture, OperativeSystem } from '../../types/download.types'

type DownloadSuccessStep = {
  title: ReactNode
  text: ReactNode
  image: string
}

type DownloadSuccessStepsWithOs = Record<OperativeSystem, DownloadSuccessStep[]>

type DownloadSuccessLayoutProps = {
  osIcon: string
  osLink: string | undefined
  productAction: string
  footerLinkLabel: string
  steps: DownloadSuccessStep[]
  fallbackLinks: Record<string, Record<string, string>>
  clientOS: OperativeSystem
  clientArch: Architecture
}

export type { DownloadSuccessLayoutProps, DownloadSuccessStep, DownloadSuccessStepsWithOs }

import type { ReactNode } from 'react'
import type { Architecture, OperativeSystem } from '../../types/download.types'

type DownloadSuccessStep = {
  title: ReactNode
  text: ReactNode
  image: string
}

enum DownloadBrowser {
  CHROME = 'Chrome',
  FIREFOX = 'Firefox',
  BRAVE = 'Brave',
  OPERA = 'Opera',
  EDGE = 'Edge',
  SAFARI = 'Safari'
}

// x / y: center of the download icon in the Step 1 image, as a percentage of the image size.
type DownloadStepOneVariant = {
  image: string
  highlight: { x: number; y: number }
}

type DownloadStepsStep = {
  title: ReactNode
  text: ReactNode
  image: string
  imageFit: 'cover' | 'contain'
  highlight?: DownloadStepOneVariant['highlight']
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

export { DownloadBrowser }
export type { DownloadStepOneVariant, DownloadStepsStep, DownloadSuccessLayoutProps, DownloadSuccessStep, DownloadSuccessStepsWithOs }

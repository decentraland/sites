import type { ReactNode } from 'react'
import { DownloadTarget, SectionViewedTrack, SegmentEvent } from '../../modules/segment'

type CTAButtonProps = {
  href: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  label: string | ReactNode[]
  subLabel?: string
  event?: SegmentEvent
  place: SectionViewedTrack
  downloadTarget?: DownloadTarget
  isFullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  isLoading?: boolean
}

export type { CTAButtonProps }

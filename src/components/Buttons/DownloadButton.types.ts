import type { ReactNode } from 'react'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'

type DownloadButtonProps = {
  href: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  label: string | ReactNode[]
  subLabel?: string
  event?: SegmentEvent
  place: SectionViewedTrack
  isFullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  isLoading?: boolean
}

export type { DownloadButtonProps }

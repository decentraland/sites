import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'

type DownloadButtonProps = {
  href: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  label: string
  subLabel?: string
  event?: SegmentEvent
  place: SectionViewedTrack
  isFullWidth?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  isLoading?: boolean
}

export type { DownloadButtonProps }

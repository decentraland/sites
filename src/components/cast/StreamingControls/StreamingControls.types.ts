import type { OverlayLayout } from '../../../features/cast2/cast2.types'

interface StreamingControlsProps {
  onToggleChat?: () => void
  onTogglePeople?: () => void
  isStreamer?: boolean
  onLeave?: () => void
  unreadMessagesCount?: number
  isTabMuted?: boolean
  onToggleTabMute?: () => void
}

interface CameraMenuDropdownProps {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  overlay: OverlayLayout | null
  onSelectDevice: (deviceId: string) => void
  onSelectOverlay: (patch: Partial<OverlayLayout>) => void
}

export type { CameraMenuDropdownProps, StreamingControlsProps }

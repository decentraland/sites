interface StreamingControlsProps {
  onToggleChat?: () => void
  onTogglePeople?: () => void
  isStreamer?: boolean
  onLeave?: () => void
  unreadMessagesCount?: number
  isTabMuted?: boolean
  onToggleTabMute?: () => void
}

export type { StreamingControlsProps }

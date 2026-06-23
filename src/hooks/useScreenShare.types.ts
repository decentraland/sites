interface ScreenShareStats {
  width?: number
  height?: number
  frameRate?: number
}

interface UseScreenShareResult {
  isScreenSharing: boolean
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
}

export type { ScreenShareStats, UseScreenShareResult }

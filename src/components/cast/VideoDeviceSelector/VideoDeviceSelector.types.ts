interface VideoDevice {
  deviceId: string
  label: string
  kind: string
}

interface VideoDeviceSelectorProps {
  selectedDeviceId?: string
  onDeviceSelect: (deviceId: string) => void
}

export type { VideoDevice, VideoDeviceSelectorProps }

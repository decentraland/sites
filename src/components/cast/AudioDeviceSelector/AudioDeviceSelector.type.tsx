interface AudioDevice {
  deviceId: string
  label: string
  kind: string
}

interface AudioDeviceSelectorProps {
  selectedDeviceId?: string
  onDeviceSelect: (deviceId: string) => void
}

export type { AudioDevice, AudioDeviceSelectorProps }

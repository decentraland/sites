import type { DeviceSelectorChildComponents } from '../DeviceSelector/DeviceSelector.types'

type MediaDeviceType = 'microphone' | 'camera' | 'audioOutput'
type MediaSelectorChildComponents = DeviceSelectorChildComponents

interface MediaSelectorProps {
  type: MediaDeviceType
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
  childComponents: MediaSelectorChildComponents
}

export type { MediaDeviceType, MediaSelectorChildComponents, MediaSelectorProps }

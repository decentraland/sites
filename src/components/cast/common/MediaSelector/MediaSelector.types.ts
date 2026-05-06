import { ComponentType } from 'react'

type MediaDeviceType = 'microphone' | 'camera' | 'audioOutput'

interface MediaSelectorChildComponents {
  SelectorButton: ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { $isOpen: boolean }>
  SelectorLabel: ComponentType<React.LabelHTMLAttributes<HTMLLabelElement>>
  DropdownList: ComponentType<React.HTMLAttributes<HTMLDivElement>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DropdownItem: ComponentType<any>
}

interface MediaSelectorProps {
  type: MediaDeviceType
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
  childComponents: MediaSelectorChildComponents
}

export type { MediaDeviceType, MediaSelectorChildComponents, MediaSelectorProps }

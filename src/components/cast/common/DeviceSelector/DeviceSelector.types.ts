import { ComponentType } from 'react'

interface DeviceOption {
  deviceId: string
  label: string
  kind: string
}

interface DeviceSelectorChildComponents {
  SelectorButton: ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { $isOpen: boolean }>
  SelectorLabel: ComponentType<React.LabelHTMLAttributes<HTMLLabelElement>>
  DropdownList: ComponentType<React.HTMLAttributes<HTMLDivElement>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DropdownItem: ComponentType<any>
}

interface DeviceSelectorProps {
  label: string
  icon?: React.ReactNode
  devices: DeviceOption[]
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
  childComponents: DeviceSelectorChildComponents
  logPrefix?: string
}

export type { DeviceOption, DeviceSelectorProps, DeviceSelectorChildComponents }

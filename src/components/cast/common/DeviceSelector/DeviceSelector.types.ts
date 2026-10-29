/* eslint-disable @typescript-eslint/naming-convention */
import type { ComponentProps, ComponentType } from 'react'
import type { Menu, MenuItem } from 'decentraland-ui2'

interface DeviceOption {
  deviceId: string
  label: string
  kind: string
}

interface DeviceSelectorChildComponents {
  SelectorButton: ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement> & { $isOpen: boolean }>
  SelectorLabel: ComponentType<React.LabelHTMLAttributes<HTMLLabelElement>>
  DropdownList: ComponentType<ComponentProps<typeof Menu>>
  DropdownItem: ComponentType<ComponentProps<typeof MenuItem>>
}

interface DeviceSelectorProps {
  label: string
  devices: DeviceOption[]
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
  childComponents: DeviceSelectorChildComponents
}

export type { DeviceOption, DeviceSelectorProps, DeviceSelectorChildComponents }

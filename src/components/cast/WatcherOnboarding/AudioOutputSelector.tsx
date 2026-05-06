import { MediaSelector } from '../common/MediaSelector'
import { DropdownItem, DropdownList, SelectorButton, SelectorLabel } from './WatcherOnboarding.styled'

interface AudioOutputSelectorProps {
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
}

export function AudioOutputSelector({ selectedDeviceId, onDeviceSelect }: AudioOutputSelectorProps) {
  return (
    <MediaSelector
      type="audioOutput"
      selectedDeviceId={selectedDeviceId}
      onDeviceSelect={onDeviceSelect}
      childComponents={{ SelectorButton, SelectorLabel, DropdownList, DropdownItem }}
    />
  )
}

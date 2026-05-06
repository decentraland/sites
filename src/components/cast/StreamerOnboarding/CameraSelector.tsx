import { MediaSelector } from '../common/MediaSelector'
import { DropdownItem, DropdownList, SelectorButton, SelectorLabel } from './StreamerOnboarding.styled'

interface CameraSelectorProps {
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
}

export function CameraSelector({ selectedDeviceId, onDeviceSelect }: CameraSelectorProps) {
  return (
    <MediaSelector
      type="camera"
      selectedDeviceId={selectedDeviceId}
      onDeviceSelect={onDeviceSelect}
      childComponents={{ SelectorButton, SelectorLabel, DropdownList, DropdownItem }}
    />
  )
}

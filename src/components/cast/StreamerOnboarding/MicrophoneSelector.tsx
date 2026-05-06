import { MediaSelector } from '../common/MediaSelector'
import { DropdownItem, DropdownList, SelectorButton, SelectorLabel } from './StreamerOnboarding.styled'

interface MicrophoneSelectorProps {
  selectedDeviceId: string
  onDeviceSelect: (deviceId: string) => void
}

export function MicrophoneSelector({ selectedDeviceId, onDeviceSelect }: MicrophoneSelectorProps) {
  return (
    <MediaSelector
      type="microphone"
      selectedDeviceId={selectedDeviceId}
      onDeviceSelect={onDeviceSelect}
      childComponents={{ SelectorButton, SelectorLabel, DropdownList, DropdownItem }}
    />
  )
}

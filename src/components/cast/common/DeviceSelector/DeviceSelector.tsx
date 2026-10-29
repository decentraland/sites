import { useCallback, useId, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/naming-convention
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { DeviceSelectorProps } from './DeviceSelector.types'
import { SelectorContainer } from './DeviceSelector.styled'

function DeviceSelector(props: DeviceSelectorProps) {
  const { label, devices, selectedDeviceId, onDeviceSelect, childComponents } = props
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const triggerId = useId()
  const listId = useId()
  const isOpen = Boolean(anchor)

  const handleClose = useCallback(() => setAnchor(null), [])
  const handleOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget), [])
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setAnchor(event.currentTarget)
    }
  }, [])

  const handleSelect = useCallback(
    (deviceId: string) => {
      onDeviceSelect(deviceId)
      setAnchor(null)
    },
    [onDeviceSelect]
  )

  return (
    <SelectorContainer>
      <childComponents.SelectorButton
        id={triggerId}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        $isOpen={isOpen}
      >
        <childComponents.SelectorLabel>{label}</childComponents.SelectorLabel>
        <KeyboardArrowDownIcon fontSize="small" />
      </childComponents.SelectorButton>
      <childComponents.DropdownList
        anchorEl={anchor}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        MenuListProps={{ id: listId, role: 'listbox', ['aria-labelledby']: triggerId }}
      >
        {devices.map(device => (
          <childComponents.DropdownItem
            key={device.deviceId}
            role="option"
            selected={device.deviceId === selectedDeviceId}
            aria-selected={device.deviceId === selectedDeviceId}
            onClick={() => handleSelect(device.deviceId)}
          >
            <span>{device.label}</span>
            {device.deviceId === selectedDeviceId && <CheckIcon fontSize="small" />}
          </childComponents.DropdownItem>
        ))}
      </childComponents.DropdownList>
    </SelectorContainer>
  )
}

export { DeviceSelector }

import { useEffect, useRef, useState } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useDropdownPosition } from '../../../../hooks/useDropdownPosition'
import { DeviceSelectorProps } from './DeviceSelector.types'

export function DeviceSelector({
  label,
  devices,
  selectedDeviceId,
  onDeviceSelect,
  childComponents,
  logPrefix = 'DeviceSelector'
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { SelectorButton, SelectorLabel, DropdownList, DropdownItem } = childComponents

  const dropdownPosition = useDropdownPosition({
    isOpen,
    containerRef,
    minWidth: 250
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (deviceId: string) => {
    const selectedDevice = devices.find(d => d.deviceId === deviceId)
    console.log(`[${logPrefix}] User selected ${label}:`, selectedDevice)
    onDeviceSelect(deviceId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      <SelectorButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        <SelectorLabel>{label}</SelectorLabel>
        <KeyboardArrowDownIcon style={{ fontSize: '20px' }} />
      </SelectorButton>

      {isOpen && dropdownPosition && (
        <DropdownList
          style={{
            top: `${dropdownPosition.top}px`,
            ...(dropdownPosition.left !== undefined ? { left: `${dropdownPosition.left}px` } : {}),
            ...(dropdownPosition.right !== undefined ? { right: `${dropdownPosition.right}px` } : {}),
            width: `${dropdownPosition.width}px`
          }}
        >
          {devices.map(device => (
            <DropdownItem
              key={device.deviceId}
              onClick={() => handleSelect(device.deviceId)}
              $isSelected={device.deviceId === selectedDeviceId}
            >
              <span>{device.label}</span>
              {device.deviceId === selectedDeviceId && <CheckIcon />}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </div>
  )
}

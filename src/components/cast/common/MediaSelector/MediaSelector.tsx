import { useEffect } from 'react'
import { CircularProgress } from 'decentraland-ui2'
import { useMediaDevices } from '../../../../hooks/useMediaDevices'
import { DeviceOption, DeviceSelector } from '../DeviceSelector'
import { MediaSelectorProps } from './MediaSelector.types'

const DEVICE_CONFIG = {
  microphone: {
    label: 'Microphone',
    logPrefix: 'MicrophoneSelector',
    getDevices: (devices: ReturnType<typeof useMediaDevices>) => devices.audioInputs,
    permissions: { requestAudio: true }
  },
  camera: {
    label: 'Camera',
    logPrefix: 'CameraSelector',
    getDevices: (devices: ReturnType<typeof useMediaDevices>) => devices.videoInputs,
    permissions: { requestVideo: true }
  },
  audioOutput: {
    label: 'Audio',
    logPrefix: 'AudioOutputSelector',
    getDevices: (devices: ReturnType<typeof useMediaDevices>) => devices.audioOutputs,
    permissions: { requestAudioOutput: true }
  }
} as const

export function MediaSelector({ type, selectedDeviceId, onDeviceSelect, childComponents }: MediaSelectorProps) {
  const config = DEVICE_CONFIG[type]
  const mediaDevices = useMediaDevices(config.permissions)
  const devices = config.getDevices(mediaDevices)
  const { isLoading } = mediaDevices

  useEffect(() => {
    if (devices.length > 0) {
      const defaultDevice = devices.find(d => d.deviceId === 'default') || devices[0]
      const hasValidSelection = selectedDeviceId && devices.some(d => d.deviceId === selectedDeviceId)

      if (!selectedDeviceId || !hasValidSelection) {
        console.log(`[${config.logPrefix}] Auto-selecting device:`, defaultDevice)
        onDeviceSelect(defaultDevice.deviceId)
      } else {
        console.log(`[${config.logPrefix}] Current selection is valid:`, selectedDeviceId)
      }
    }
  }, [devices, selectedDeviceId, onDeviceSelect, config.logPrefix])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40px' }}>
        <CircularProgress size={20} />
      </div>
    )
  }

  if (devices.length === 0) {
    return null
  }

  const deviceOptions: DeviceOption[] = devices.map(device => ({
    deviceId: device.deviceId,
    label: device.label,
    kind: device.kind
  }))

  return (
    <DeviceSelector
      label={config.label}
      devices={deviceOptions}
      selectedDeviceId={selectedDeviceId}
      onDeviceSelect={onDeviceSelect}
      childComponents={childComponents}
      logPrefix={config.logPrefix}
    />
  )
}

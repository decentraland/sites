import { useCallback, useEffect, useState } from 'react'
import { InputLabel, Select } from 'decentraland-ui2'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { VideoDevice, VideoDeviceSelectorProps } from './VideoDeviceSelector.types'
import { LoadingText, NoDevicesText, SelectorContainer, StyledFormControl, StyledMenuItem } from './VideoDeviceSelector.styled'

export function VideoDeviceSelector({ selectedDeviceId, onDeviceSelect }: VideoDeviceSelectorProps) {
  const { t } = useCastTranslation()
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([])
  const [loading, setLoading] = useState(true)

  const getVideoDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }))

      setVideoDevices(videoInputs)

      const hasValidSelection = selectedDeviceId && videoInputs.some(d => d.deviceId === selectedDeviceId)
      if ((!selectedDeviceId || !hasValidSelection) && videoInputs.length > 0) {
        onDeviceSelect(videoInputs[0].deviceId)
      }
    } catch {
      // Error getting video devices
    } finally {
      setLoading(false)
    }
  }, [selectedDeviceId, onDeviceSelect])

  useEffect(() => {
    getVideoDevices()

    const handleDeviceChange = () => {
      getVideoDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [getVideoDevices])

  if (loading) {
    return (
      <SelectorContainer>
        <LoadingText variant="body2">{t('device_selector.loading', { type: 'video' })}</LoadingText>
      </SelectorContainer>
    )
  }

  if (videoDevices.length === 0) {
    return (
      <SelectorContainer>
        <NoDevicesText variant="body2">{t('device_selector.no_devices', { type: 'video' })}</NoDevicesText>
      </SelectorContainer>
    )
  }

  return (
    <SelectorContainer>
      <StyledFormControl variant="outlined" size="small">
        <InputLabel>{t('device_selector.video_input')}</InputLabel>
        <Select
          value={selectedDeviceId && videoDevices.some(d => d.deviceId === selectedDeviceId) ? selectedDeviceId : ''}
          onChange={e => onDeviceSelect(e.target.value)}
          label={t('device_selector.video_input')}
          displayEmpty
        >
          {!selectedDeviceId && (
            <StyledMenuItem value="">
              <em>{t('device_selector.select_device', { type: 'Video' })}</em>
            </StyledMenuItem>
          )}
          {videoDevices.map(device => (
            <StyledMenuItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </StyledMenuItem>
          ))}
        </Select>
      </StyledFormControl>
    </SelectorContainer>
  )
}

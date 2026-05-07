import { useCallback, useEffect, useState } from 'react'
import { InputLabel, Select } from 'decentraland-ui2'
import { useCastTranslation } from '../../../features/media/cast/useCastTranslation'
import { AudioDevice, AudioDeviceSelectorProps } from './AudioDeviceSelector.type'
import { LoadingText, NoDevicesText, SelectorContainer, StyledFormControl, StyledMenuItem } from './AudioDeviceSelector.styled'

export function AudioDeviceSelector({ selectedDeviceId, onDeviceSelect }: AudioDeviceSelectorProps) {
  const { t } = useCastTranslation()
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [loading, setLoading] = useState(true)

  const getAudioDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }))

      setAudioDevices(audioInputs)

      const hasValidSelection = selectedDeviceId && audioInputs.some(d => d.deviceId === selectedDeviceId)
      if ((!selectedDeviceId || !hasValidSelection) && audioInputs.length > 0) {
        onDeviceSelect(audioInputs[0].deviceId)
      }
    } catch {
      // Error getting audio devices
    } finally {
      setLoading(false)
    }
  }, [selectedDeviceId, onDeviceSelect])

  useEffect(() => {
    getAudioDevices()

    const handleDeviceChange = () => {
      getAudioDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [getAudioDevices])

  if (loading) {
    return (
      <SelectorContainer>
        <LoadingText variant="body2">{t('device_selector.loading', { type: 'audio' })}</LoadingText>
      </SelectorContainer>
    )
  }

  if (audioDevices.length === 0) {
    return (
      <SelectorContainer>
        <NoDevicesText variant="body2">{t('device_selector.no_devices', { type: 'audio' })}</NoDevicesText>
      </SelectorContainer>
    )
  }

  return (
    <SelectorContainer>
      <StyledFormControl variant="outlined" size="small">
        <InputLabel>{t('device_selector.audio_input')}</InputLabel>
        <Select
          value={selectedDeviceId && audioDevices.some(d => d.deviceId === selectedDeviceId) ? selectedDeviceId : ''}
          onChange={e => onDeviceSelect(e.target.value)}
          label={t('device_selector.audio_input')}
          displayEmpty
        >
          {!selectedDeviceId && (
            <StyledMenuItem value="">
              <em>{t('device_selector.select_device', { type: 'Audio' })}</em>
            </StyledMenuItem>
          )}
          {audioDevices.map(device => (
            <StyledMenuItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </StyledMenuItem>
          ))}
        </Select>
      </StyledFormControl>
    </SelectorContainer>
  )
}

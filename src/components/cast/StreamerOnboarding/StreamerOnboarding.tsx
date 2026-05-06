import { useEffect, useState } from 'react'
import MicIcon from '@mui/icons-material/Mic'
import VideocamIcon from '@mui/icons-material/Videocam'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { AnimatedBackground, Logo } from 'decentraland-ui2'
import { getDeviceSettings, saveDeviceSettings } from '../../../features/cast2/cast2.utils'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { AudioOutputSelector } from './AudioOutputSelector'
import { CameraSelector } from './CameraSelector'
import { MicrophoneSelector } from './MicrophoneSelector'
import { StreamerOnboardingProps } from './StreamerOnboarding.types'
import {
  DeviceSelectorRow,
  DeviceSelectorsContainer,
  JoinButton,
  JoiningContainer,
  JoiningLogo,
  JoiningSpinner,
  JoiningText,
  LogoContainer,
  OnboardingContainer,
  OnboardingModal,
  ParticipantLabel,
  StyledTextField,
  Title
} from './StreamerOnboarding.styled'

export function StreamerOnboarding({ streamName = 'Stream', onJoin, isJoining }: StreamerOnboardingProps) {
  const { t } = useCastTranslation()
  const [displayName, setDisplayName] = useState('')
  const [audioInputId, setAudioInputId] = useState('')
  const [audioOutputId, setAudioOutputId] = useState('')
  const [videoDeviceId, setVideoDeviceId] = useState('')

  // Load saved device settings on mount
  useEffect(() => {
    const savedSettings = getDeviceSettings()
    if (savedSettings) {
      if (savedSettings.audioInputId) setAudioInputId(savedSettings.audioInputId)
      if (savedSettings.audioOutputId) setAudioOutputId(savedSettings.audioOutputId)
      if (savedSettings.videoDeviceId) setVideoDeviceId(savedSettings.videoDeviceId)
    }
  }, [])

  const handleJoin = () => {
    if (!canJoin) return

    // Save device settings for next time
    saveDeviceSettings({
      audioInputId,
      audioOutputId,
      videoDeviceId
    })

    onJoin({
      displayName: displayName.trim() || '',
      audioInputId,
      audioOutputId,
      videoDeviceId
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin()
    }
  }

  const canJoin = audioInputId && audioOutputId && videoDeviceId

  if (isJoining) {
    return (
      <OnboardingContainer>
        <AnimatedBackground variant="absolute" />
        <JoiningContainer>
          <JoiningLogo>
            <Logo size="huge" />
          </JoiningLogo>
          <JoiningText>{t('onboarding.joining')}</JoiningText>
          <JoiningSpinner />
        </JoiningContainer>
      </OnboardingContainer>
    )
  }

  return (
    <OnboardingContainer>
      <AnimatedBackground variant="absolute" />
      <OnboardingModal onKeyDown={handleKeyDown}>
        <LogoContainer>
          <Logo size="huge" />
        </LogoContainer>

        <Title>{t('onboarding.speaker_title', { streamName })}</Title>
        <ParticipantLabel>{t('onboarding.speaker_tag')}</ParticipantLabel>

        <StyledTextField
          fullWidth
          placeholder={t('onboarding.name_placeholder')}
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          variant="outlined"
          size="small"
          autoFocus
        />

        <DeviceSelectorsContainer>
          <DeviceSelectorRow>
            <MicIcon />
            <MicrophoneSelector selectedDeviceId={audioInputId} onDeviceSelect={setAudioInputId} />
          </DeviceSelectorRow>

          <DeviceSelectorRow>
            <VolumeUpIcon />
            <AudioOutputSelector selectedDeviceId={audioOutputId} onDeviceSelect={setAudioOutputId} />
          </DeviceSelectorRow>

          <DeviceSelectorRow>
            <VideocamIcon />
            <CameraSelector selectedDeviceId={videoDeviceId} onDeviceSelect={setVideoDeviceId} />
          </DeviceSelectorRow>
        </DeviceSelectorsContainer>

        <JoinButton onClick={handleJoin} disabled={!canJoin || isJoining}>
          {t('onboarding.join_now')}
        </JoinButton>
      </OnboardingModal>
    </OnboardingContainer>
  )
}

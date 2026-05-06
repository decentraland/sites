import { useState } from 'react'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import logoImage from '../../../assets/images/cast/logo.png'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { AudioOutputSelector } from './AudioOutputSelector'
import { WatcherOnboardingProps } from './WatcherOnboarding.types'
import {
  DeviceSelectorRow,
  DeviceSelectorsContainer,
  JoinButton,
  JoiningContainer,
  JoiningLogo,
  JoiningLogoImage,
  JoiningSpinner,
  JoiningText,
  LogoContainer,
  LogoImage,
  OnboardingContainer,
  OnboardingModal,
  Title,
  WatcherLabel
} from './WatcherOnboarding.styled'

export function WatcherOnboarding({ streamName = 'Stream', onJoin, isJoining }: WatcherOnboardingProps) {
  const { t } = useCastTranslation()
  const [audioOutputId, setAudioOutputId] = useState('')

  const handleJoin = () => {
    if (!canJoin) return

    onJoin({
      audioOutputId
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin()
    }
  }

  const canJoin = audioOutputId

  if (isJoining) {
    return (
      <OnboardingContainer>
        <JoiningContainer>
          <JoiningLogo>
            <JoiningLogoImage src={logoImage} alt="Decentraland Logo" />
          </JoiningLogo>
          <JoiningSpinner />
          <JoiningText>{t('onboarding.joining')}</JoiningText>
        </JoiningContainer>
      </OnboardingContainer>
    )
  }

  return (
    <OnboardingContainer>
      <OnboardingModal onKeyDown={handleKeyDown}>
        <LogoContainer>
          <LogoImage src={logoImage} alt="Decentraland Logo" />
        </LogoContainer>

        <Title>{t('onboarding.viewer_title', { streamName })}</Title>
        <WatcherLabel>{t('onboarding.viewer_tag')}</WatcherLabel>

        <DeviceSelectorsContainer>
          <DeviceSelectorRow>
            <VolumeUpIcon />
            <AudioOutputSelector selectedDeviceId={audioOutputId} onDeviceSelect={setAudioOutputId} />
          </DeviceSelectorRow>
        </DeviceSelectorsContainer>

        <JoinButton onClick={handleJoin} disabled={!canJoin || isJoining}>
          {t('onboarding.join_now')}
        </JoinButton>
      </OnboardingModal>
    </OnboardingContainer>
  )
}

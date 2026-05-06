import { useAudioWaveform, useIsSpeaking } from '@livekit/components-react'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { SpeakingIndicatorProps } from './SpeakingIndicator.types'
import { SpeakingCircle } from './SpeakingIndicator.styled'

export function SpeakingIndicator({ participant, trackRef }: SpeakingIndicatorProps) {
  const { t } = useCastTranslation()
  const isSpeaking = useIsSpeaking(participant)

  // Get audio waveform for intensity (experimental)
  const audioWaveform = useAudioWaveform(trackRef, {
    barCount: 1,
    updateInterval: 100,
    volMultiplier: 1.5
  })

  // Calculate speaking intensity from waveform
  const intensity = audioWaveform?.bars?.length ? Math.max(...audioWaveform.bars) / 255 : 0.5

  return (
    <SpeakingCircle isSpeaking={isSpeaking} intensity={intensity} title={isSpeaking ? t('status.speaking') : t('status.not_speaking')} />
  )
}

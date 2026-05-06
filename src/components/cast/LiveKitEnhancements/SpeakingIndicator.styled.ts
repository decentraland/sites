import { keyframes } from '@emotion/react'
import { styled } from 'decentraland-ui2'

const waveAnimation = keyframes({
  '0%': {
    transform: 'scale(1)',
    opacity: 1
  },
  '100%': {
    transform: 'scale(2.5)',
    opacity: 0
  }
})

const SpeakingCircle = styled('div')<{ isSpeaking: boolean; intensity: number }>(({ isSpeaking }) => ({
  position: 'relative',
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: isSpeaking ? '#1e90ff' : 'rgba(255, 255, 255, 0.3)',
  transition: 'all 0.2s ease',
  opacity: isSpeaking ? 1 : 0.5,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: 'white',
    opacity: isSpeaking ? 0.8 : 0.3
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '2px solid #1e90ff',
    opacity: isSpeaking ? 0.6 : 0,
    animation: isSpeaking ? `${waveAnimation} 1.5s ease-out infinite` : 'none'
  }
}))

export { SpeakingCircle }

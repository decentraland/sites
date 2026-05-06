/* eslint-disable @typescript-eslint/naming-convention */
import { keyframes } from '@emotion/react'
import { Typography, styled } from 'decentraland-ui2'

const fadeInOut = keyframes({
  '0%, 100%': { opacity: 0.6 },
  '50%': { opacity: 1 }
})

const EmptyContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(80, 227, 194, 0.1) 100%)',
  textAlign: 'center',
  padding: '40px 20px',
  boxSizing: 'border-box'
})

const StreamerEmptyContainer = styled('div', {
  shouldForwardProp: prop => typeof prop === 'string' && !prop.startsWith('$')
})<{ $isSpeaking?: boolean }>(({ $isSpeaking }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  background: 'linear-gradient(180deg, rgba(102, 73, 127, 0.6) 0%, rgba(63, 35, 87, 0.6) 100%)',
  padding: '40px 20px',
  boxSizing: 'border-box',
  border: $isSpeaking ? '3px solid #1e90ff' : '1px solid #a24bf3',
  borderRadius: 16,
  position: 'relative',
  transition: 'border 0.3s ease'
}))

const AvatarPulse = styled('div')({
  animation: `${fadeInOut} 2s ease-in-out infinite`
})

const ParticipantNameOverlay = styled('div')({
  position: 'absolute',
  bottom: 12,
  left: 12,
  color: 'white',
  fontSize: 14,
  fontWeight: 500,
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  padding: '6px 12px',
  borderRadius: 8,
  zIndex: 2
})

const EmptyIconWrapper = styled('div')({
  fontSize: 64,
  marginBottom: 20,
  animation: `${fadeInOut} 2s ease-in-out infinite`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& svg': {
    fontSize: 64,
    color: 'rgba(255, 255, 255, 0.7)'
  }
})

const EmptyTitle = styled(Typography)(() => ({
  color: 'white',
  fontWeight: 600,
  marginBottom: 12,
  fontSize: 24
}))

const EmptySubtitle = styled(Typography)(() => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 16,
  maxWidth: 300,
  lineHeight: 1.5
}))

const SpeakingIndicatorWrapper = styled('div')({
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 3
})

export {
  AvatarPulse,
  EmptyContainer,
  EmptyIconWrapper,
  EmptySubtitle,
  EmptyTitle,
  ParticipantNameOverlay,
  SpeakingIndicatorWrapper,
  StreamerEmptyContainer
}

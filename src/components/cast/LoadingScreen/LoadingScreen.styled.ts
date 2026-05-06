/* eslint-disable @typescript-eslint/naming-convention */
import { keyframes } from '@emotion/react'
import { styled } from 'decentraland-ui2'

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' }
})

const LoadingContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #d80029 0%, #16213e 50%, #0d1117 100%)',
  color: 'white',
  textAlign: 'center'
})

const LoadingSpinner = styled('div')({
  width: 48,
  height: 48,
  border: '4px solid rgba(255, 255, 255, 0.1)',
  borderTop: '4px solid var(--primary)',
  borderRadius: '50%',
  animation: `${spin} 1s linear infinite`,
  marginBottom: 20
})

const LoadingText = styled('h3')({
  color: 'white',
  fontWeight: 500,
  margin: 0
})

export { LoadingContainer, LoadingSpinner, LoadingText }

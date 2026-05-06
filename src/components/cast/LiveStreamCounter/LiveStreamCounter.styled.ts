import { keyframes } from '@emotion/react'
import { styled } from 'decentraland-ui2'

const pulse = keyframes({
  '0%, 100%': {
    opacity: 1
  },
  '50%': {
    opacity: 0.6
  }
})

const CounterContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 20,
  left: 20,
  zIndex: 15,
  [theme.breakpoints.down('sm')]: {
    top: 16,
    left: 16
  }
}))

const LivePill = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  background: '#FF2D55',
  borderRadius: 24,
  fontWeight: 'bold',
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: 1,
  flexShrink: 0,
  color: '#FFFFFF',
  boxShadow: '0 4px 12px rgba(255, 45, 85, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
  '& svg': {
    fontSize: 16,
    color: '#FFFFFF',
    animation: `${pulse} 1.5s infinite`
  },
  [theme.breakpoints.down('sm')]: {
    padding: '6px 12px',
    fontSize: 11,
    gap: 6
  }
}))

export { CounterContainer, LivePill }

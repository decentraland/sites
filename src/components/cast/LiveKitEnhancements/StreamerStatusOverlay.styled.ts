import { styled } from 'decentraland-ui2'

const OverlayContainer = styled('div')({
  position: 'absolute',
  bottom: 16,
  right: 16,
  zIndex: 10,
  display: 'flex',
  gap: 8
})

const StatusBadge = styled('div')<{ $isActive: boolean; $type: 'muted' | 'camera' | 'speaking' }>(({ $isActive, $type }) => {
  let background = 'rgba(149, 165, 166, 0.9)'

  if ($type === 'muted') {
    background = $isActive ? 'rgba(255, 71, 87, 0.9)' : 'rgba(46, 204, 113, 0.9)'
  } else if ($type === 'speaking') {
    background = 'rgba(46, 204, 113, 0.9)'
  } else {
    background = $isActive ? 'rgba(46, 204, 113, 0.9)' : 'rgba(149, 165, 166, 0.9)'
  }

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 500,
    background,
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)'
  }
})

const IconWrapper = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    fontSize: 16
  }
})

export { IconWrapper, OverlayContainer, StatusBadge }

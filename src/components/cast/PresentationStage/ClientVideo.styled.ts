import { styled } from 'decentraland-ui2'

const PlayerContainer = styled('div')({
  width: '100%',
  height: '100%'
})

const PlayerVideo = styled('video')({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain'
})

const UnmuteSlot = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: '50%',
  bottom: theme.spacing(2),
  transform: 'translateX(-50%)',
  pointerEvents: 'auto'
}))

export { PlayerContainer, PlayerVideo, UnmuteSlot }

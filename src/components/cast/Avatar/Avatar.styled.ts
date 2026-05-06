import { styled } from 'decentraland-ui2'

const AvatarContainer = styled('div')<{ $size: number }>(({ $size }) => ({
  width: $size,
  height: $size,
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0,
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const AvatarImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '50%'
})

export { AvatarContainer, AvatarImage }

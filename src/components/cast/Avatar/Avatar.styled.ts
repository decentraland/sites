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

// Used when the user has no profile picture. The background colour is
// deterministic per identity (ADR-292 / NameColorHelper) so it matches the
// in-world client. Initial sits centred with a subtle text shadow for
// contrast on lighter hues.
const AvatarFallbackCircle = styled('div')<{ $backgroundColor: string }>(({ $backgroundColor }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: $backgroundColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const AvatarInitial = styled('span')<{ $size: number }>(({ $size }) => ({
  fontSize: `${Math.max(10, Math.round($size * 0.45))}px`,
  fontWeight: 600,
  color: '#ffffff',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
  textTransform: 'uppercase',
  lineHeight: 1,
  fontFamily: 'inherit'
}))

export { AvatarContainer, AvatarFallbackCircle, AvatarImage, AvatarInitial }

import { useEffect, useState } from 'react'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { AvatarContainer, AvatarFallback, AvatarImage, AvatarInitial } from './ProfileAvatar.styled'

interface ProfileAvatarProps {
  address: string | undefined
  size?: number
  borderColor?: string
  className?: string
}

function firstGrapheme(value: string): string {
  for (const ch of value) return ch
  return ''
}

function ProfileAvatar({ address, size = 76, borderColor = 'rgba(255, 255, 255, 0.5)', className }: ProfileAvatarProps) {
  const { avatarFace, name, backgroundColor } = useProfileAvatar(address)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [avatarFace])

  const showImage = Boolean(avatarFace) && !imageError
  const initial = firstGrapheme(name ?? '') || firstGrapheme(address ?? '') || '?'

  return (
    <AvatarContainer $size={size} $borderColor={borderColor} $backgroundColor={backgroundColor} className={className}>
      {showImage && avatarFace ? (
        <AvatarImage src={avatarFace} alt={name ?? address ?? 'Avatar'} onError={() => setImageError(true)} />
      ) : (
        <AvatarFallback>
          <AvatarInitial $size={size}>{initial.toUpperCase()}</AvatarInitial>
        </AvatarFallback>
      )}
    </AvatarContainer>
  )
}

export { ProfileAvatar }
export type { ProfileAvatarProps }

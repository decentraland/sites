import { useEffect, useMemo, useState } from 'react'
import defaultAvatarImage from '../../../assets/images/cast/avatar.png'
import { Profile } from '../../../features/cast2/peer'
import { AvatarContainer, AvatarImage } from './Avatar.styled'

interface AvatarProps {
  profile?: Profile | null
  address?: string
  size?: number
  className?: string
}

export function Avatar({ profile, address, size = 32, className }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const avatarUrl = useMemo(() => {
    // Use profile avatar if available and no error
    if (profile?.avatarFace256 && !imageError) {
      return profile.avatarFace256
    }
    // Fallback to default avatar
    return defaultAvatarImage
  }, [profile, imageError])

  const handleImageError = () => {
    console.log('[Avatar] Failed to load image, using default avatar')
    setImageError(true)
  }

  // Reset error state when profile changes
  useEffect(() => {
    setImageError(false)
  }, [profile?.avatarFace256])

  return (
    <AvatarContainer $size={size} className={className}>
      <AvatarImage src={avatarUrl} alt={profile?.name || address || 'Avatar'} onError={handleImageError} />
    </AvatarContainer>
  )
}

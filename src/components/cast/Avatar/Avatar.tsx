import { useEffect, useMemo, useState } from 'react'
import type { ProfileSummary } from '../../../features/profile/profile.types'
import { getAvatarBackgroundColor, getDisplayName as getValidatedDisplayName } from '../../../utils/avatarColor'
import { AvatarContainer, AvatarFallbackCircle, AvatarImage, AvatarInitial } from './Avatar.styled'

interface AvatarProps {
  // Convenience prop — pass the resolved peer profile and Avatar will pick
  // avatarFace256, name, hasClaimedName and address from it.
  profile?: ProfileSummary | null
  // Manual overrides for callers that don't have a Profile (e.g. anonymous
  // LiveKit participants known only by their displayName). `address` and
  // `ethAddress` are equivalent — both feed the deterministic background
  // colour fallback (NameColorHelper / ADR-292).
  name?: string
  imageUrl?: string
  hasClaimedName?: boolean
  ethAddress?: string
  address?: string
  size?: number
  className?: string
}

const firstGrapheme = (value: string): string => {
  // Iterate by code point so emoji and surrogates count as a single character.
  for (const ch of value) return ch
  return ''
}

export function Avatar({ profile, name, imageUrl, hasClaimedName, ethAddress, address, size = 32, className }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const resolvedImageUrl = imageUrl ?? profile?.avatarFace256
  const resolvedName = name ?? profile?.name ?? undefined
  const resolvedAddress = ethAddress ?? address ?? profile?.address ?? undefined
  const resolvedHasClaimedName = hasClaimedName ?? profile?.hasClaimedName ?? false

  const displayName = useMemo(
    () =>
      getValidatedDisplayName({
        name: resolvedName,
        hasClaimedName: resolvedHasClaimedName,
        ethAddress: resolvedAddress
      }),
    [resolvedName, resolvedHasClaimedName, resolvedAddress]
  )

  const backgroundColor = useMemo(
    () => getAvatarBackgroundColor(displayName || resolvedAddress || resolvedName),
    [displayName, resolvedAddress, resolvedName]
  )

  // Prefer the validated display name's first char, then the raw name, then
  // the first char of the wallet address (strip `0x`). Only fall back to `?`
  // when even an address is missing — keeps anonymous-but-real participants
  // visually distinguishable.
  const addressInitial = resolvedAddress?.startsWith('0x') ? resolvedAddress.charAt(2) : resolvedAddress?.charAt(0)
  const initial = firstGrapheme(displayName) || firstGrapheme(resolvedName ?? '') || addressInitial || '?'

  // Reset the image-error guard whenever the source URL changes so the next
  // profile load gets a fresh attempt rather than the previous failure stuck.
  useEffect(() => {
    setImageError(false)
  }, [resolvedImageUrl])

  const showImage = !!resolvedImageUrl && !imageError

  return (
    <AvatarContainer $size={size} className={className}>
      {showImage ? (
        <AvatarImage src={resolvedImageUrl} alt={resolvedName || resolvedAddress || 'Avatar'} onError={() => setImageError(true)} />
      ) : (
        <AvatarFallbackCircle $backgroundColor={backgroundColor}>
          <AvatarInitial $size={size}>{initial.toUpperCase()}</AvatarInitial>
        </AvatarFallbackCircle>
      )}
    </AvatarContainer>
  )
}

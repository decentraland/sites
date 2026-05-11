import { useMemo } from 'react'
import type { Avatar } from '@dcl/schemas'
import { buildMinimalAvatar } from '../utils/avatar'
import { useProfileAvatar } from './useProfileAvatar'

type CreatorAvatarResult = {
  avatar: Avatar | undefined
  avatarFace: string | undefined
  backgroundColor: string
}

// Catalyst stores the face image under the deployment entity hash
// (`/entities/<bafkrei…>/face.png`), not the wallet address. Building the URL
// from the address — as a previous version of this hook did — produced 404s
// for every creator whose deployment hash differs from their address, which
// is the common case. Resolving the actual face URL requires the lambdas
// profile fetch that `useProfileAvatar` already performs.
function useCreatorAvatar(address: string | undefined, name?: string): CreatorAvatarResult {
  const { avatarFace, name: profileName, backgroundColor } = useProfileAvatar(address)

  const avatar = useMemo<Avatar | undefined>(() => {
    if (!address) return undefined
    return buildMinimalAvatar({ name: profileName ?? name ?? '', ethAddress: address, faceUrl: avatarFace })
  }, [address, name, profileName, avatarFace])

  return { avatar, avatarFace, backgroundColor }
}

export { useCreatorAvatar }
export type { CreatorAvatarResult }

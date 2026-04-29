import { DCL_FOUNDATION_LOGO_URL, DCL_FOUNDATION_NAME, isDclFoundationCreator } from '../features/whats-on-events/events.helpers'
import { useProfileAvatar } from './useProfileAvatar'

interface UseCreatorProfileResult {
  isDclFoundation: boolean
  creatorName: string | undefined
  avatarFace: string | undefined
}

function useCreatorProfile(
  address: string | undefined,
  userName: string | null | undefined,
  fallbackName?: string
): UseCreatorProfileResult {
  const isDclFoundation = isDclFoundationCreator(userName)
  const { avatarFace: profileFace, name: avatarName } = useProfileAvatar(address, { skip: !address || isDclFoundation })
  const creatorName = isDclFoundation ? DCL_FOUNDATION_NAME : avatarName || userName || fallbackName
  const avatarFace = isDclFoundation ? DCL_FOUNDATION_LOGO_URL : profileFace
  return { isDclFoundation, creatorName, avatarFace }
}

export { useCreatorProfile }
export type { UseCreatorProfileResult }

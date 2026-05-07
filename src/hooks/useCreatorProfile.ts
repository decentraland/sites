import { DCL_FOUNDATION_LOGO_URL, DCL_FOUNDATION_NAME, isDclFoundationCreator } from '../features/experiences/events/events.helpers'
import { DCL_FOUNDATION_BACKGROUND_COLOR, getAvatarBackgroundColor, getDisplayName } from '../utils/avatarColor'
import { useProfileAvatar } from './useProfileAvatar'

interface UseCreatorProfileResult {
  isDclFoundation: boolean
  creatorName: string | undefined
  avatarFace: string | undefined
  backgroundColor: string
}

function useCreatorProfile(
  address: string | undefined,
  userName: string | null | undefined,
  fallbackName?: string
): UseCreatorProfileResult {
  const isDclFoundation = isDclFoundationCreator(userName)
  const {
    avatarFace: profileFace,
    name: avatarName,
    backgroundColor: profileBackgroundColor
  } = useProfileAvatar(address, {
    skip: !address || isDclFoundation
  })
  const creatorName = isDclFoundation ? DCL_FOUNDATION_NAME : avatarName || userName || fallbackName
  const avatarFace = isDclFoundation ? DCL_FOUNDATION_LOGO_URL : profileFace
  const fallbackBackgroundColor = creatorName
    ? getAvatarBackgroundColor(getDisplayName({ name: creatorName, hasClaimedName: false, ethAddress: address }))
    : profileBackgroundColor
  const backgroundColor = isDclFoundation ? DCL_FOUNDATION_BACKGROUND_COLOR : avatarName ? profileBackgroundColor : fallbackBackgroundColor
  return { isDclFoundation, creatorName, avatarFace, backgroundColor }
}

export { useCreatorProfile }
export type { UseCreatorProfileResult }

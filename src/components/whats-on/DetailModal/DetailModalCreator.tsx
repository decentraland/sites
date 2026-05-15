import { useCallback } from 'react'
import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { formatEthAddress } from '../../../utils/avatar'
import { useOpenProfileModal } from '../../profile/ProfileModal/useOpenProfileModal'
import { AvatarFallback, AvatarImage, CreatorButton, CreatorName, CreatorNameHighlight, CreatorRow } from './DetailModal.styled'

interface DetailModalCreatorProps {
  address: string | undefined
  name: string | undefined
  prefixLabel: string
}

function DetailModalCreator({ address, name, prefixLabel }: DetailModalCreatorProps) {
  const fallback = address ? formatEthAddress(address) : undefined
  const { creatorName, avatarFace, backgroundColor, isDclFoundation } = useCreatorProfile(address, name, fallback)
  const openProfile = useOpenProfileModal()

  const handleClick = useCallback(() => {
    if (!address) return
    openProfile(address)
  }, [address, openProfile])

  if (!avatarFace && !creatorName) return null

  const content = (
    <>
      {avatarFace ? (
        <AvatarImage src={avatarFace} alt={creatorName ?? ''} fallbackColor={backgroundColor} />
      ) : (
        <AvatarFallback fallbackColor={backgroundColor} />
      )}
      <CreatorName>
        {prefixLabel}
        <CreatorNameHighlight>{creatorName}</CreatorNameHighlight>
      </CreatorName>
    </>
  )

  // DCL Foundation has no on-chain profile to open; keep it as a static row.
  if (!address || isDclFoundation) {
    return <CreatorRow>{content}</CreatorRow>
  }

  return (
    <CreatorButton type="button" onClick={handleClick} aria-label={creatorName ?? address}>
      {content}
    </CreatorButton>
  )
}

export { DetailModalCreator }
export type { DetailModalCreatorProps }

import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { formatEthAddress } from '../../../utils/avatar'
import { getCreatorColor } from '../../../utils/creatorColor'
import { AvatarFallback, AvatarImage, CreatorName, CreatorNameHighlight, CreatorRow } from './DetailModal.styled'

interface DetailModalCreatorProps {
  address: string | undefined
  name: string | undefined
  prefixLabel: string
}

function DetailModalCreator({ address, name, prefixLabel }: DetailModalCreatorProps) {
  const fallback = address ? formatEthAddress(address) : undefined
  const { creatorName, avatarFace } = useCreatorProfile(address, name, fallback)
  const fallbackColor = getCreatorColor(address)

  if (!avatarFace && !creatorName) return null

  return (
    <CreatorRow>
      {avatarFace ? (
        <AvatarImage src={avatarFace} alt={creatorName ?? ''} fallbackColor={fallbackColor} />
      ) : (
        <AvatarFallback fallbackColor={fallbackColor} />
      )}
      <CreatorName>
        {prefixLabel}
        <CreatorNameHighlight>{creatorName}</CreatorNameHighlight>
      </CreatorName>
    </CreatorRow>
  )
}

export { DetailModalCreator }
export type { DetailModalCreatorProps }

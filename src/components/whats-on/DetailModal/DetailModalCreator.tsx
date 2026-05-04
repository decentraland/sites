import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { formatEthAddress } from '../../../utils/avatar'
import { AvatarFallback, AvatarImage, CreatorName, CreatorNameHighlight, CreatorRow } from './DetailModal.styled'

interface DetailModalCreatorProps {
  address: string | undefined
  name: string | undefined
  prefixLabel: string
}

function DetailModalCreator({ address, name, prefixLabel }: DetailModalCreatorProps) {
  const fallback = address ? formatEthAddress(address) : undefined
  const { creatorName, avatarFace, backgroundColor } = useCreatorProfile(address, name, fallback)

  if (!avatarFace && !creatorName) return null

  return (
    <CreatorRow>
      {avatarFace ? (
        <AvatarImage src={avatarFace} alt={creatorName ?? ''} fallbackColor={backgroundColor} />
      ) : (
        <AvatarFallback fallbackColor={backgroundColor} />
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

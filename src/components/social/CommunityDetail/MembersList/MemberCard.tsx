import { memo } from 'react'
import { useTheme } from 'decentraland-ui2'
import { getRarityColor } from '../../../../features/communities/communities.helpers'
import { ClaimedNameIcon } from './ClaimedNameIcon'
import type { MemberCardProps } from './MemberCard.types'
import { MemberAvatar, MemberAvatarContainer, MemberInfo, MemberItem, MemberName, MemberNameRow, MemberRole } from './MembersList.styled'

function MemberCardComponent(props: MemberCardProps) {
  const { memberAddress, name, role, profilePictureUrl, hasClaimedName } = props
  const theme = useTheme()
  const backgroundColor = getRarityColor(theme, memberAddress)

  return (
    <MemberItem>
      <MemberAvatarContainer>
        <MemberAvatar src={profilePictureUrl} backgroundColor={backgroundColor} />
      </MemberAvatarContainer>
      <MemberInfo>
        <MemberNameRow>
          <MemberName>{name}</MemberName>
          {hasClaimedName && <ClaimedNameIcon data-testid="claimed-name-icon" aria-label="Claimed name badge" />}
        </MemberNameRow>
        <MemberRole>{role}</MemberRole>
      </MemberInfo>
    </MemberItem>
  )
}

const MemberCard = memo(MemberCardComponent)

export { MemberCard }

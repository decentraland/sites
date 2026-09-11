import { memo } from 'react'
import { useTheme } from 'decentraland-ui2'
import { getRarityColor } from '../../../../features/communities/communities.helpers'
import { AvatarSkeleton, NameSkeleton } from '../CommunityDetail.styled'
import { ClaimedNameIcon } from './ClaimedNameIcon'
import type { MemberCardProps } from './MemberCard.types'
import { MemberAvatar, MemberAvatarContainer, MemberInfo, MemberItem, MemberName, MemberNameRow, MemberRole } from './MembersList.styled'

// The role is known from the members page itself; the name and face wait on the
// profile batch, so those two slots draw a skeleton until it settles.
function MemberCardComponent(props: MemberCardProps) {
  const { memberAddress, name, role, profilePictureUrl, hasClaimedName, isLoadingProfile } = props
  const theme = useTheme()
  const backgroundColor = getRarityColor(theme, memberAddress)

  return (
    <MemberItem aria-busy={isLoadingProfile}>
      <MemberAvatarContainer>
        {isLoadingProfile ? (
          <AvatarSkeleton variant="circular" />
        ) : (
          <MemberAvatar src={profilePictureUrl} backgroundColor={backgroundColor} />
        )}
      </MemberAvatarContainer>
      <MemberInfo>
        <MemberNameRow>
          {isLoadingProfile ? (
            <NameSkeleton variant="text" width="60%" />
          ) : (
            <>
              <MemberName>{name}</MemberName>
              {hasClaimedName && <ClaimedNameIcon data-testid="claimed-name-icon" aria-label="Claimed name badge" />}
            </>
          )}
        </MemberNameRow>
        <MemberRole>{role}</MemberRole>
      </MemberInfo>
    </MemberItem>
  )
}

const MemberCard = memo(MemberCardComponent)

export { MemberCard }

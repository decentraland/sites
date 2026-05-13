import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import { Chip, CircularProgress, Typography } from 'decentraland-ui2'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import type { ProfileCommunity } from '../../../features/profile/profile.social.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import {
  CommunityCard,
  CommunityCardBody,
  CommunityFallback,
  CommunityMembers,
  CommunityName,
  CommunityRow,
  CommunityThumb,
  CommunityThumbImage,
  EmptyBio,
  LoadingRow
} from './CommunitiesTab.styled'

interface CommunitiesTabProps {
  address: string
  isOwnProfile: boolean
}

function CommunitiesTab({ address, isOwnProfile }: CommunitiesTabProps) {
  const t = useFormatMessage()
  // The HTTP endpoint enforces `auth === :address` — skip the call entirely on
  // member profiles to avoid a guaranteed 401.
  const { data, isLoading } = useGetProfileCommunitiesQuery({ address }, { skip: !isOwnProfile })
  const communities = useMemo<ProfileCommunity[]>(() => data?.data?.results ?? [], [data])

  if (!isOwnProfile) {
    return <EmptyBio sx={{ mt: 1 }}>{t('profile.communities.private')}</EmptyBio>
  }

  if (isLoading) {
    return (
      <LoadingRow>
        <CircularProgress size={28} />
      </LoadingRow>
    )
  }

  if (communities.length === 0) {
    return <EmptyBio sx={{ mt: 1 }}>{t(isOwnProfile ? 'profile.communities.empty_owner' : 'profile.communities.empty_member')}</EmptyBio>
  }

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('profile.communities.count', { count: communities.length })}
      </Typography>
      <CommunityRow>
        {communities.map(community => (
          <CommunityCard key={community.id} href={`/social/communities/${community.id}`}>
            <CommunityThumb>
              {community.thumbnail ? (
                <CommunityThumbImage src={community.thumbnail} alt={community.name} loading="lazy" />
              ) : (
                <CommunityFallback>
                  <GroupsOutlinedIcon sx={{ fontSize: 28 }} />
                </CommunityFallback>
              )}
            </CommunityThumb>
            <CommunityCardBody>
              <CommunityName>{community.name}</CommunityName>
              <CommunityMembers>
                {typeof community.membersCount === 'number'
                  ? t('profile.communities.members_count', { count: community.membersCount })
                  : t('profile.communities.member')}
              </CommunityMembers>
            </CommunityCardBody>
            {community.role && community.role !== 'member' ? (
              <Chip label={t(`profile.communities.role_${community.role}`)} size="small" color="primary" />
            ) : null}
          </CommunityCard>
        ))}
      </CommunityRow>
    </>
  )
}

export { CommunitiesTab }
export type { CommunitiesTabProps }

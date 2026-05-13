import { useMemo } from 'react'
import { NFTGrid } from '../../../components/profile/NFTGrid'
import type { NFTGridItem } from '../../../components/profile/NFTGrid'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import type { ProfileCommunity } from '../../../features/profile/profile.social.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'

interface CommunitiesTabProps {
  address: string
  isOwnProfile: boolean
}

function toGridItem(community: ProfileCommunity): NFTGridItem {
  const role = community.role ? ` · ${community.role}` : ''
  const members = typeof community.membersCount === 'number' ? `${community.membersCount} members` : ''
  return {
    id: community.id,
    name: community.name,
    image: community.thumbnail ?? '',
    subtitle: `${members}${role}`.trim(),
    href: `/social/communities/${community.id}`
  }
}

function CommunitiesTab({ address, isOwnProfile }: CommunitiesTabProps) {
  const t = useFormatMessage()
  const { data, isLoading } = useGetProfileCommunitiesQuery({ address })
  const items = useMemo<NFTGridItem[]>(() => (data?.data?.results ?? []).map(toGridItem), [data])

  return (
    <NFTGrid
      items={items}
      isLoading={isLoading}
      emptyTitle={t('profile.communities.empty_title')}
      emptyDescription={t(isOwnProfile ? 'profile.communities.empty_owner' : 'profile.communities.empty_member')}
    />
  )
}

export { CommunitiesTab }
export type { CommunitiesTabProps }

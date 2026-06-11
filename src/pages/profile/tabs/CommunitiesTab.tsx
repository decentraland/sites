import { memo, useCallback, useMemo, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import { CircularProgress, Tooltip } from 'decentraland-ui2'
import { CommunityDetailModal, useOpenCommunityModal } from '../../../components/profile/CommunityDetailModal'
import { getThumbnailUrl as getCommunityThumbnailUrl } from '../../../features/communities/communities.helpers'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import type { ProfileCommunity } from '../../../features/profile/profile.social.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useCopyShareLink } from '../../../hooks/useCopyShareLink'
import {
  CommunityActionButton,
  CommunityActionRow,
  CommunityCard,
  CommunityCardBody,
  CommunityCountLabel,
  CommunityFallback,
  CommunityName,
  CommunityRow,
  CommunityShareButton,
  CommunityThumb,
  CommunityThumbImage,
  EmptyBio,
  LoadingRow,
  MemberCountBadge,
  OwnerChip
} from './CommunitiesTab.styled'

interface CommunitiesTabProps {
  address: string
  isOwnProfile: boolean
}

function CommunitiesTab({ address, isOwnProfile }: CommunitiesTabProps) {
  const t = useFormatMessage()
  // Member view only receives the user's publicly visible communities (public + listed);
  // the endpoint returns the full list (incl. private/unlisted) for the member themselves.
  const { data, isLoading } = useGetProfileCommunitiesQuery({ address })
  const communities = useMemo<ProfileCommunity[]>(() => data?.data?.results ?? [], [data])
  const { openCommunityId, open: openCommunity, close: closeCommunity } = useOpenCommunityModal()

  // Stable `(id, event) => void` handler — passing `(id) => (event) => ...` would
  // build a fresh closure per render and defeat the `memo()` wrap on the card.
  const handleOpenCommunity = useCallback(
    (id: string, event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      openCommunity(id)
    },
    [openCommunity]
  )

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
      <CommunityCountLabel>{t('profile.communities.count', { count: communities.length })}</CommunityCountLabel>
      <CommunityRow>
        {communities.map(community => (
          <CommunityCardItem key={community.id} community={community} isOwnProfile={isOwnProfile} onOpen={handleOpenCommunity} />
        ))}
      </CommunityRow>
      <CommunityDetailModal communityId={openCommunityId} onClose={closeCommunity} />
    </>
  )
}

interface CommunityCardItemProps {
  community: ProfileCommunity
  isOwnProfile: boolean
  onOpen: (id: string, event: React.MouseEvent<HTMLAnchorElement>) => void
}

const CommunityCardItem = memo(function CommunityCardItem({ community, isOwnProfile, onOpen }: CommunityCardItemProps) {
  const t = useFormatMessage()
  const handleAnchorClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => onOpen(community.id, event), [community.id, onOpen])
  const shareUrl = `${window.location.origin}/social/communities/${community.id}`
  const { copied, handleCopy } = useCopyShareLink(shareUrl)
  const isOwner = community.role === 'owner' || community.role === 'admin'
  // The social API doesn't return a `thumbnail` field for /members/:address/communities;
  // fall back to the CDN raw-thumbnail URL (same helper used by CommunityDetail).
  // Track 404s so we can render the icon fallback if the image isn't uploaded yet.
  const thumbnailUrl = community.thumbnail ?? getCommunityThumbnailUrl(community.id)
  const [thumbnailFailed, setThumbnailFailed] = useState(false)
  const handleThumbnailError = useCallback(() => setThumbnailFailed(true), [])
  const handleShare = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      handleCopy()
    },
    [handleCopy]
  )

  return (
    <CommunityCard href={`/social/communities/${community.id}`} onClick={handleAnchorClick}>
      <CommunityThumb>
        {thumbnailUrl && !thumbnailFailed ? (
          <CommunityThumbImage src={thumbnailUrl} alt={community.name} loading="lazy" onError={handleThumbnailError} />
        ) : (
          <CommunityFallback>
            <GroupsOutlinedIcon />
          </CommunityFallback>
        )}
        {isOwner ? <OwnerChip>{t(`profile.communities.role_${community.role}`)}</OwnerChip> : null}
        {typeof community.membersCount === 'number' ? (
          <MemberCountBadge>
            <PeopleAltOutlinedIcon />
            {community.membersCount}
          </MemberCountBadge>
        ) : null}
      </CommunityThumb>
      <CommunityCardBody>
        <CommunityName>{community.name}</CommunityName>
        <CommunityActionRow>
          <CommunityActionButton>
            {/* "JOINED" only makes sense on the viewer's own profile — on a member profile the
                role belongs to the profile owner, not the viewer, so every card reads "VIEW".
                The check mark comes from Figma note 677:57902 ("Add a tik to the joined CTA"). */}
            {isOwner || !isOwnProfile ? (
              t('profile.communities.action_view')
            ) : (
              <>
                <CheckIcon fontSize="small" />
                {t('profile.communities.action_joined')}
              </>
            )}
          </CommunityActionButton>
          <Tooltip title={copied ? t('profile.communities.copied') : t('profile.communities.copy_link')} placement="top" arrow>
            <CommunityShareButton type="button" onClick={handleShare} aria-label={t('profile.communities.copy_link')}>
              <ContentCopyIcon />
            </CommunityShareButton>
          </Tooltip>
        </CommunityActionRow>
      </CommunityCardBody>
    </CommunityCard>
  )
})

CommunityCardItem.displayName = 'CommunityCardItem'

export { CommunitiesTab }
export type { CommunitiesTabProps }

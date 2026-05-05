import { createElement, memo, useCallback, useMemo } from 'react'
import checkIcon from '@mui/icons-material/Check'
import { useAnalytics } from '@dcl/hooks'
import { useTabletAndBelowMediaQuery, useTabletMediaQuery, useTheme } from 'decentraland-ui2'
import { getRarityColor, getThumbnailUrl } from '../../../../features/communities/communities.helpers'
import { type Community, Privacy } from '../../../../features/communities/communities.types'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useProfilePicture } from '../../../../hooks/useProfilePicture'
import { SegmentEvent } from '../../../../modules/segment.types'
import { redirectToAuth } from '../../../../utils/authRedirect'
import { AllowedAction } from '../CommunityDetail.types'
import { CommunityJumpInButton } from './CommunityJumpInButton'
import { PrivacyIcon } from './PrivacyIcon'
import {
  ActionButtons,
  CTAButton,
  CommunityDetails,
  CommunityImage,
  CommunityImageContent,
  CommunityLabel,
  Description,
  DescriptionRow,
  InfoSection,
  OwnerAvatar,
  OwnerAvatarContainer,
  OwnerName,
  OwnerRow,
  OwnerText,
  PrivacyBadgeContainer,
  PrivacyBadgeText,
  PrivacyDivider,
  PrivacyIconContainer,
  PrivacyMembersRow,
  PrivacyMembersText,
  Title,
  TitleContainer,
  TitleHeader,
  TopRow
} from './CommunityInfo.styled'

type CommunityInfoProps = {
  community: Community
  isLoggedIn: boolean
  address?: string
  isPerformingCommunityAction: boolean
  isMember: boolean
  canViewContent: boolean
  hasPendingRequest?: boolean
  isLoadingMemberRequests?: boolean
  onJoin: (communityId: string) => Promise<void>
  onRequestToJoin?: (communityId: string) => Promise<void>
  onCancelRequest?: (communityId: string) => Promise<void>
}

function CommunityInfoComponent({
  community,
  isLoggedIn,
  address,
  isPerformingCommunityAction,
  isMember,
  canViewContent,
  hasPendingRequest = false,
  isLoadingMemberRequests = false,
  onJoin,
  onRequestToJoin,
  onCancelRequest
}: CommunityInfoProps) {
  const t = useFormatMessage()
  const theme = useTheme()
  const { track } = useAnalytics()
  const isTabletOrMobile = useTabletAndBelowMediaQuery()
  const isTablet = useTabletMediaQuery()
  const ownerProfilePicture = useProfilePicture(community.ownerAddress)
  const ownerAvatarBackgroundColor = useMemo(() => getRarityColor(theme, community.ownerAddress), [theme, community.ownerAddress])

  const thumbnailUrl = getThumbnailUrl(community.id)
  const isPrivate = community.privacy === Privacy.PRIVATE
  const formattedMembersCount = useMemo(
    () => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(community.membersCount),
    [community.membersCount]
  )

  const trackPayload = useMemo(() => ({ communityId: community.id, userAddress: address }), [community.id, address])

  const handleJoinClick = useCallback(() => {
    track(SegmentEvent.COMMUNITY_CLICK_JOIN, trackPayload)
    if (!isLoggedIn || !address) {
      redirectToAuth(`/social/communities/${community.id}`, { action: AllowedAction.JOIN })
      return
    }
    void onJoin(community.id)
  }, [community.id, isLoggedIn, address, onJoin, track, trackPayload])

  const handleRequestToJoinClick = useCallback(() => {
    track(SegmentEvent.COMMUNITY_CLICK_REQUEST_TO_JOIN, trackPayload)
    if (!isLoggedIn || !address) {
      redirectToAuth(`/social/communities/${community.id}`, { action: AllowedAction.REQUEST_TO_JOIN })
      return
    }
    if (onRequestToJoin) void onRequestToJoin(community.id)
  }, [community.id, isLoggedIn, address, onRequestToJoin, track, trackPayload])

  const handleCancelRequestClick = useCallback(() => {
    track(SegmentEvent.COMMUNITY_CLICK_CANCEL_REQUEST, trackPayload)
    if (!isLoggedIn || !address || !onCancelRequest) return
    void onCancelRequest(community.id)
  }, [community.id, isLoggedIn, address, onCancelRequest, track, trackPayload])

  const handleSignInToJoinClick = useCallback(() => {
    track(SegmentEvent.COMMUNITY_CLICK_SIGN_IN_TO_JOIN, trackPayload)
    const action = isPrivate ? AllowedAction.REQUEST_TO_JOIN : AllowedAction.JOIN
    redirectToAuth(`/social/communities/${community.id}`, { action })
  }, [community.id, isPrivate, track, trackPayload])

  const renderActionButton = () => {
    if (isMember) {
      return (
        <CTAButton variant="outlined" color="secondary" disabled startIcon={createElement(checkIcon, { fontSize: 'small' })}>
          {t('community.info.joined')}
        </CTAButton>
      )
    }
    if (!isLoggedIn) {
      return (
        <CTAButton color="primary" variant="contained" onClick={handleSignInToJoinClick}>
          {t('community.info.sign_in_to_join')}
        </CTAButton>
      )
    }
    if (isPrivate) {
      if (isLoadingMemberRequests) {
        return (
          <CTAButton color="secondary" variant="contained" disabled>
            {t('community.global.loading')}
          </CTAButton>
        )
      }
      const label = isPerformingCommunityAction
        ? t('community.global.loading')
        : hasPendingRequest
          ? t('community.info.cancel_request')
          : t('community.info.request_to_join')
      return (
        <CTAButton
          color="secondary"
          variant="contained"
          onClick={hasPendingRequest ? handleCancelRequestClick : handleRequestToJoinClick}
          disabled={isPerformingCommunityAction}
        >
          {label}
        </CTAButton>
      )
    }
    return (
      <CTAButton color="primary" variant="contained" onClick={handleJoinClick} disabled={isPerformingCommunityAction}>
        {isPerformingCommunityAction ? t('community.global.loading') : t('community.info.join')}
      </CTAButton>
    )
  }

  const shouldShowJumpIn = isLoggedIn && !isTabletOrMobile && (isMember || hasPendingRequest)

  return (
    <InfoSection>
      <TopRow>
        <CommunityImage>{thumbnailUrl && <CommunityImageContent src={thumbnailUrl} alt={community.name} />}</CommunityImage>
        <CommunityDetails>
          <TitleContainer>
            <CommunityLabel>{t('community.info.decentraland_community')}</CommunityLabel>
            <TitleHeader>
              <Title>{community.name}</Title>
              <PrivacyMembersRow>
                <PrivacyBadgeContainer>
                  <PrivacyIconContainer>
                    <PrivacyIcon />
                  </PrivacyIconContainer>
                  <PrivacyBadgeText>{community.privacy}</PrivacyBadgeText>
                </PrivacyBadgeContainer>
                <PrivacyDivider />
                <PrivacyMembersText>
                  {formattedMembersCount} {t('community.info.members')}
                </PrivacyMembersText>
              </PrivacyMembersRow>
            </TitleHeader>
            <OwnerRow>
              <OwnerAvatarContainer>
                <OwnerAvatar src={ownerProfilePicture} backgroundColor={ownerAvatarBackgroundColor} />
              </OwnerAvatarContainer>
              <OwnerText>
                {t('community.info.by')} <OwnerName>{community.ownerName ?? t('community.info.unknown')}</OwnerName>
              </OwnerText>
            </OwnerRow>
            <ActionButtons>
              {renderActionButton()}
              {shouldShowJumpIn && (
                <CommunityJumpInButton
                  communityId={community.id}
                  onTrack={data => track(SegmentEvent.COMMUNITY_CLICK_JUMP_IN, { ...trackPayload, ...data })}
                />
              )}
            </ActionButtons>
          </TitleContainer>
          {canViewContent && !isTablet && <Description>{community.description}</Description>}
        </CommunityDetails>
      </TopRow>
      {canViewContent && isTablet && (
        <DescriptionRow>
          <Description>{community.description}</Description>
        </DescriptionRow>
      )}
    </InfoSection>
  )
}

const CommunityInfo = memo(CommunityInfoComponent)

export { CommunityInfo }

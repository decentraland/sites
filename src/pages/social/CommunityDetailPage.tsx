import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { CommunityDetail } from '../../components/social/CommunityDetail'
import { useGetCommunityByIdQuery } from '../../features/communities/communities.client'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'
import { useBlogPageTracking } from '../../hooks/useBlogPageTracking'
import {
  InitialLoader,
  NotFoundContainer,
  NotFoundDescription,
  NotFoundIcon,
  NotFoundTitle,
  PageContainer
} from './CommunityDetailPage.styled'

function CommunityDetailPage() {
  const t = useFormatMessage()
  const { id } = useParams<{ id: string }>()
  const { hasValidIdentity, address } = useAuthIdentity()

  const shouldSkip = !id
  const { data, isLoading, isError } = useGetCommunityByIdQuery({ id: id ?? '', isSigned: hasValidIdentity }, { skip: shouldSkip })

  const community = data?.data

  useBlogPageTracking({
    name: community?.name,
    properties: community ? { communityId: community.id, privacy: community.privacy, membersCount: community.membersCount } : undefined
  })

  if (isLoading) {
    return (
      <PageContainer>
        <InitialLoader>
          <CircularProgress />
        </InitialLoader>
      </PageContainer>
    )
  }

  if (isError || !community) {
    return (
      <PageContainer>
        <Helmet>
          <title>{t('community.detail.not_found')}</title>
        </Helmet>
        <NotFoundContainer>
          <NotFoundIcon />
          <NotFoundTitle>{t('community.detail.not_found')}</NotFoundTitle>
          <NotFoundDescription>{t('community.detail.not_found_description')}</NotFoundDescription>
        </NotFoundContainer>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Helmet>
        <title>{community.name} | Decentraland</title>
        <meta name="description" content={community.description} />
      </Helmet>
      <CommunityDetail community={community} isLoggedIn={hasValidIdentity} address={address} />
    </PageContainer>
  )
}

export { CommunityDetailPage }

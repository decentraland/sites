import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTabletAndBelowMediaQuery } from 'decentraland-ui2'
import {
  useCancelCommunityRequestMutation,
  useCreateCommunityRequestMutation,
  useGetMemberRequestsQuery,
  useJoinCommunityMutation
} from '../../../features/communities/communities.client'
import { isMember as checkIsMember } from '../../../features/communities/communities.helpers'
import { type Community, type CommunityEvent, Privacy, RequestStatus, RequestType } from '../../../features/communities/communities.types'
import type { EventEntry } from '../../../features/whats-on-events'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useEventDetailModal } from '../../../hooks/useEventDetailModal'
import { usePaginatedCommunityEvents } from '../../../hooks/usePaginatedCommunityEvents'
import { usePaginatedCommunityMembers } from '../../../hooks/usePaginatedCommunityMembers'
import { EventDetailModal } from '../../whats-on/EventDetailModal'
import { CommunityInfo } from './CommunityInfo'
import { describeError } from './errorUtils'
import { EventsList } from './EventsList'
import { MemberCardProps, MembersList } from './MembersList'
import { PrivateMessage } from './PrivateMessage'
import { type TabType, Tabs } from './Tabs'
import { AllowedAction } from './CommunityDetail.types'
import { BottomSection, ContentContainer, EventsColumn, HiddenStatus, MembersColumn } from './CommunityDetail.styled'

type CommunityDetailProps = {
  community: Community
  isLoggedIn: boolean
  address?: string
}

function getCommunityEventCoordinates(event: CommunityEvent): [number, number] {
  return [event.coordinates?.[0] ?? event.position?.[0] ?? event.x ?? 0, event.coordinates?.[1] ?? event.position?.[1] ?? event.y ?? 0]
}

function getCommunityEventDuration(event: CommunityEvent): number {
  if (event.duration !== undefined) return event.duration
  const start = new Date(event.startAt).getTime()
  const finish = new Date(event.finishAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(finish)) return 0
  return Math.max(0, Math.floor((finish - start) / 1000))
}

/* eslint-disable @typescript-eslint/naming-convention */
function mapCommunityEventToEventEntry(event: CommunityEvent): EventEntry {
  const coordinates = getCommunityEventCoordinates(event)
  return {
    id: event.id,
    name: event.name,
    description: event.description ?? null,
    image: event.image ?? null,
    image_vertical: event.imageVertical ?? null,
    start_at: event.startAt,
    finish_at: event.finishAt,
    next_start_at: event.nextStartAt ?? event.startAt,
    next_finish_at: event.nextFinishAt ?? event.finishAt,
    duration: getCommunityEventDuration(event),
    all_day: event.allDay ?? false,
    x: coordinates[0],
    y: coordinates[1],
    coordinates,
    position: event.position ?? coordinates,
    server: event.server ?? null,
    url: event.url ?? '',
    user: event.user ?? '',
    user_name: event.userName ?? null,
    estate_id: event.estateId ?? null,
    estate_name: event.estateName ?? null,
    scene_name: event.sceneName ?? null,
    approved: event.approved,
    rejected: event.rejected,
    rejection_reason: event.rejectionReason ?? null,
    highlighted: event.highlighted ?? false,
    trending: event.trending ?? false,
    recurrent: event.recurrent ?? false,
    recurrent_frequency: (event.recurrentFrequency ?? null) as EventEntry['recurrent_frequency'],
    recurrent_dates: event.recurrentDates ?? [],
    contact: event.contact ?? null,
    details: event.details ?? null,
    categories: event.categories ?? [],
    schedules: event.schedules ?? [],
    world: event.world ?? false,
    place_id: event.placeId ?? null,
    community_id: event.communityId ?? null,
    total_attendees: event.totalAttendees,
    latest_attendees: event.latestAttendees,
    attending: event.attending,
    live: event.live ?? false,
    created_at: event.createdAt ?? '',
    updated_at: event.updatedAt ?? ''
  }
}
/* eslint-enable @typescript-eslint/naming-convention */

function CommunityDetailComponent({ community, isLoggedIn, address }: CommunityDetailProps) {
  const t = useFormatMessage()
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const { closeEventDetailModal, modalData, openEventDetailModal } = useEventDetailModal()
  const isTabletOrMobile = useTabletAndBelowMediaQuery()
  const [activeTab, setActiveTab] = useState<TabType>('members')
  const [errorKind, setErrorKind] = useState<'fetch' | 'message' | 'unknown' | null>(null)
  const executedActionRef = useRef<string | null>(null)

  const member = checkIsMember(community)
  const isPrivate = community.privacy === Privacy.PRIVATE
  const canViewContent = member || !isPrivate
  const shouldFetchMembersAndEvents = !isPrivate || member

  const shouldFetchRequests = isLoggedIn && !!address && isPrivate && !member
  const { data: memberRequestsData, isLoading: isLoadingMemberRequests } = useGetMemberRequestsQuery(
    { address: address ?? '', type: RequestType.REQUEST_TO_JOIN },
    { skip: !shouldFetchRequests }
  )
  const pendingRequest = memberRequestsData?.data.results.find(
    request =>
      request.communityId === community.id && request.status === RequestStatus.PENDING && request.type === RequestType.REQUEST_TO_JOIN
  )
  const hasPendingRequest = Boolean(pendingRequest)

  const [joinCommunity, { isLoading: isJoining }] = useJoinCommunityMutation()
  const [createCommunityRequest, { isLoading: isCreatingRequest }] = useCreateCommunityRequestMutation()
  const [cancelCommunityRequest, { isLoading: isCancellingRequest }] = useCancelCommunityRequestMutation()
  const isPerformingCommunityAction = isJoining || isCreatingRequest || isCancellingRequest

  const {
    members,
    isLoading: isLoadingMembers,
    isFetchingMore: isFetchingMoreMembers,
    hasMore: hasMoreMembers,
    loadMore: loadMoreMembers,
    total: totalMembers
  } = usePaginatedCommunityMembers({ communityId: community.id, enabled: shouldFetchMembersAndEvents })

  const {
    events,
    isLoading: isLoadingEvents,
    isFetchingMore: isFetchingMoreEvents,
    hasMore: hasMoreEvents,
    loadMore: loadMoreEvents
  } = usePaginatedCommunityEvents({ communityId: community.id, enabled: shouldFetchMembersAndEvents })

  const handleJoin = useCallback(
    async (communityId: string) => {
      if (!isLoggedIn || !address) return
      try {
        await joinCommunity(communityId).unwrap()
        setErrorKind(null)
      } catch (err) {
        // Log raw error for debugging; surface a generic message via i18n (rule 10).
        console.error('[CommunityDetail] join failed', err)
        setErrorKind(describeError(err))
      }
    },
    [isLoggedIn, address, joinCommunity]
  )

  const handleRequestToJoin = useCallback(
    async (communityId: string) => {
      if (!isLoggedIn || !address) return
      try {
        await createCommunityRequest({ communityId, targetedAddress: address }).unwrap()
        setErrorKind(null)
      } catch (err) {
        console.error('[CommunityDetail] request-to-join failed', err)
        setErrorKind(describeError(err))
      }
    },
    [isLoggedIn, address, createCommunityRequest]
  )

  const handleCancelRequest = useCallback(
    async (communityId: string) => {
      if (!isLoggedIn || !address || !pendingRequest?.id) return
      try {
        await cancelCommunityRequest({ communityId, requestId: pendingRequest.id, address }).unwrap()
        setErrorKind(null)
      } catch (err) {
        console.error('[CommunityDetail] cancel-request failed', err)
        setErrorKind(describeError(err))
      }
    },
    [isLoggedIn, address, cancelCommunityRequest, pendingRequest?.id]
  )

  // Auto-execute action after auth redirect: ?action=join|requestToJoin
  useEffect(() => {
    const params = new URLSearchParams(search)
    const action = params.get('action') as AllowedAction | null
    if (!action) return

    const removeParam = () => {
      params.delete('action')
      const next = params.toString()
      navigate({ pathname, search: next ? `?${next}` : '' }, { replace: true })
    }

    const isValid = (Object.values(AllowedAction) as string[]).includes(action)
    if (!isValid) {
      removeParam()
      return
    }

    if (executedActionRef.current === action) return
    if (!isLoggedIn || !address || isPerformingCommunityAction) return

    if (action === AllowedAction.JOIN && member) {
      removeParam()
      return
    }
    if (action === AllowedAction.REQUEST_TO_JOIN && hasPendingRequest) {
      removeParam()
      return
    }

    executedActionRef.current = action
    const run = action === AllowedAction.JOIN ? handleJoin(community.id) : handleRequestToJoin(community.id)
    void run.finally(removeParam)
  }, [
    search,
    pathname,
    navigate,
    isLoggedIn,
    address,
    community.id,
    member,
    hasPendingRequest,
    isPerformingCommunityAction,
    handleJoin,
    handleRequestToJoin
  ])

  const memberCards: MemberCardProps[] = members.map(item => ({
    memberAddress: item.memberAddress,
    name: item.name ?? item.memberAddress,
    role: item.role,
    profilePictureUrl: item.profilePictureUrl ?? '',
    hasClaimedName: item.hasClaimedName ?? false
  }))

  const eventListItems = events.map(mapCommunityEventToEventEntry)

  return (
    <ContentContainer>
      <CommunityInfo
        community={community}
        isLoggedIn={isLoggedIn}
        address={address}
        isPerformingCommunityAction={isPerformingCommunityAction}
        isMember={member}
        canViewContent={canViewContent}
        hasPendingRequest={hasPendingRequest}
        isLoadingMemberRequests={isLoadingMemberRequests}
        onJoin={handleJoin}
        onRequestToJoin={handleRequestToJoin}
        onCancelRequest={pendingRequest ? handleCancelRequest : undefined}
      />

      {!canViewContent && <PrivateMessage />}

      {canViewContent && (
        <BottomSection>
          {isTabletOrMobile ? (
            <>
              <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
              {activeTab === 'members' ? (
                <MembersColumn>
                  <MembersList
                    members={memberCards}
                    isLoading={isLoadingMembers}
                    isFetchingMore={isFetchingMoreMembers}
                    hasMore={hasMoreMembers}
                    onLoadMore={loadMoreMembers}
                    hideTitle
                    showCount={false}
                    total={totalMembers}
                  />
                </MembersColumn>
              ) : (
                <EventsColumn>
                  <EventsList
                    events={eventListItems}
                    isLoading={isLoadingEvents}
                    isFetchingMore={isFetchingMoreEvents}
                    hasMore={hasMoreEvents}
                    onLoadMore={loadMoreEvents}
                    onEventClick={openEventDetailModal}
                    hideTitle
                  />
                </EventsColumn>
              )}
            </>
          ) : (
            <>
              <MembersColumn>
                <MembersList
                  members={memberCards}
                  isLoading={isLoadingMembers}
                  isFetchingMore={isFetchingMoreMembers}
                  hasMore={hasMoreMembers}
                  onLoadMore={loadMoreMembers}
                  total={totalMembers}
                />
              </MembersColumn>
              <EventsColumn>
                <EventsList
                  events={eventListItems}
                  isLoading={isLoadingEvents}
                  isFetchingMore={isFetchingMoreEvents}
                  hasMore={hasMoreEvents}
                  onLoadMore={loadMoreEvents}
                  onEventClick={openEventDetailModal}
                />
              </EventsColumn>
            </>
          )}
        </BottomSection>
      )}

      {errorKind && (
        <HiddenStatus role="alert" aria-live="polite">
          {t('community.detail.failed_to_join')}
        </HiddenStatus>
      )}
      <EventDetailModal open={!!modalData} onClose={closeEventDetailModal} data={modalData} />
    </ContentContainer>
  )
}

const CommunityDetail = memo(CommunityDetailComponent)

export { CommunityDetail }

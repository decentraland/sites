enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

enum RequestType {
  INVITE = 'invite',
  REQUEST_TO_JOIN = 'request_to_join'
}

enum RequestIntention {
  CANCELLED = 'cancelled'
}

enum Privacy {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

enum Visibility {
  ALL = 'all',
  UNLISTED = 'unlisted'
}

enum Role {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  NONE = 'none'
}

type CommunityThumbnails = {
  [key: string]: string
}

type VoiceChatStatus = {
  isActive: boolean
  participantCount: number
  moderatorCount: number
}

type Community = {
  id: string
  name: string
  description: string
  ownerAddress: string
  ownerName?: string
  privacy: Privacy
  visibility: Visibility
  active: boolean
  membersCount: number
  thumbnails?: CommunityThumbnails
  role?: Role
  voiceChatStatus?: VoiceChatStatus
}

type CommunityResponse = {
  data: Community
}

type JoinCommunityResponse = {
  success: boolean
  message?: string
}

type CommunityMember = {
  communityId: string
  memberAddress: string
  role: Role
  joinedAt: string
  profilePictureUrl?: string
  hasClaimedName?: boolean
  name?: string
  friendshipStatus?: number
}

type Paginated<T> = {
  results: T[]
  total: number
  page: number
  pages: number
  limit: number
}

type CommunityMembersResponse = {
  data: Paginated<CommunityMember>
}

type CommunityEvent = {
  id: string
  name: string
  description?: string
  image?: string
  imageVertical?: string | null
  startAt: string
  finishAt: string
  nextStartAt?: string
  nextFinishAt?: string
  duration?: number
  allDay?: boolean
  x?: number
  y?: number
  coordinates?: [number, number]
  position?: [number, number]
  server?: string
  sceneName?: string
  user?: string
  userName?: string | null
  estateId?: string | null
  estateName?: string | null
  approved: boolean
  rejected: boolean
  rejectionReason?: string | null
  highlighted?: boolean
  trending?: boolean
  recurrent?: boolean
  recurrentFrequency?: string | null
  recurrentInterval?: number | null
  recurrentCount?: number | null
  recurrentUntil?: string | null
  recurrentDates?: string[]
  contact?: string | null
  details?: string | null
  categories?: string[]
  schedules?: string[]
  world?: boolean
  placeId?: string | null
  communityId?: string | null
  attending?: boolean
  totalAttendees: number
  latestAttendees: string[]
  url?: string
  live?: boolean
  createdAt?: string
  updatedAt?: string
}

type CommunityEventsResponse = {
  ok: boolean
  data: {
    events: CommunityEvent[]
    total: number
  }
}

type MemberRequest = {
  id: string
  communityId: string
  memberAddress: string
  type: RequestType
  status: RequestStatus
}

type MemberCommunityRequest = Omit<Community, 'id'> & {
  id: string
  communityId: string
  type: RequestType
  status: RequestStatus
}

type CreateCommunityRequestResponse = {
  data: MemberRequest
}

type MemberRequestsResponse = {
  data: Paginated<MemberCommunityRequest>
}

export type {
  Community,
  CommunityResponse,
  CommunityMember,
  CommunityMembersResponse,
  CommunityEvent,
  CommunityEventsResponse,
  JoinCommunityResponse,
  MemberRequest,
  MemberCommunityRequest,
  CreateCommunityRequestResponse,
  MemberRequestsResponse
}
export { Privacy, RequestIntention, RequestStatus, RequestType, Role }

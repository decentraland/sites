import { useEffect, useMemo, useRef } from 'react'
import { toMemberCards } from '../features/communities/communities.helpers'
import type { CommunityMemberCard } from '../features/communities/communities.helpers.types'
import type { CommunityMember } from '../features/communities/communities.types'
import { useProfiles } from './useProfiles'

type UseCommunityMemberCardsResult = {
  memberCards: CommunityMemberCard[]
  isResolvingProfiles: boolean
}

// The /v2 members endpoint is address-only, so names and avatars come from one batched
// Catalyst lookup per page. Until that batch lands the rows would read as raw hex, so
// the caller keeps its skeleton up — but only until this community has resolved once.
// After that, appended pages fill in row by row instead of blanking the whole list.
function useCommunityMemberCards(communityId: string, members: CommunityMember[]): UseCommunityMemberCardsResult {
  const memberAddresses = useMemo(() => members.map(member => member.memberAddress), [members])
  const { profiles, error } = useProfiles(memberAddresses)

  const hasCovered = members.length > 0 && members.every(member => profiles.has(member.memberAddress.toLowerCase()))
  // An appended page arrives before its profiles do. Hold back just those rows so they
  // appear a moment later already named, instead of flashing as raw hex. Nobody is lost:
  // a member with no deployed profile still gets a cache entry, so they stay visible and
  // fall back to their address. A failed batch shows everything rather than hiding rows.
  const visibleMembers = useMemo(
    () => (hasCovered || error ? members : members.filter(member => profiles.has(member.memberAddress.toLowerCase()))),
    [hasCovered, error, members, profiles]
  )
  const memberCards = useMemo(() => toMemberCards(visibleMembers, profiles), [visibleMembers, profiles])
  // `profiles` is a shared cache, so it can already hold entries for a community the
  // user is switching into (communities overlap). Remembering which communities actually
  // resolved is what separates "still loading this list" from "appending to it" — a set,
  // not the last id, so returning to an earlier community doesn't look unresolved again.
  const resolvedCommunitiesRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (hasCovered) resolvedCommunitiesRef.current.add(communityId)
  }, [hasCovered, communityId])

  const hasResolvedThisCommunity = resolvedCommunitiesRef.current.has(communityId)
  const isResolvingProfiles = members.length > 0 && !hasCovered && !hasResolvedThisCommunity && !error

  return { memberCards, isResolvingProfiles }
}

export { useCommunityMemberCards }
export type { UseCommunityMemberCardsResult }

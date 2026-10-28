import { useMemo } from 'react'
import { toMemberCards } from '../features/communities/communities.helpers'
import type { CommunityMemberCard } from '../features/communities/communities.helpers.types'
import type { CommunityMember } from '../features/communities/communities.types'
import { useProfiles } from './useProfiles'

// The /v2 members endpoint is address-only, so names and avatars come from one batched
// Catalyst lookup per page. Every member is listed the moment their page lands: a row
// whose profile is still in flight is flagged so `MemberCard` draws a skeleton, and one
// whose batch failed or has no deployed profile falls back to the address. Keeping every
// row mounted is also what keeps the infinite-scroll sentinel honest — the list grows
// with the page, so the sentinel moves out of view instead of asking for the next one.
// NOTE: the list-level gate that held rows (and the whole list, on first load) until
// their batch landed was dropped on purpose; the per-row skeletons replace it and it
// should not come back.
function useCommunityMemberCards(members: CommunityMember[]): CommunityMemberCard[] {
  const memberAddresses = useMemo(() => members.map(member => member.memberAddress), [members])
  const { profiles } = useProfiles(memberAddresses)
  return useMemo(() => toMemberCards(members, profiles), [members, profiles])
}

export { useCommunityMemberCards }

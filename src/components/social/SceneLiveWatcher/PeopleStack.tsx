import { useMemo, useState } from 'react'
import { useRemoteParticipants } from '@livekit/components-react'
import { Popover } from 'decentraland-ui2'
import type { Profile } from '../../../features/cast2/peer'
import { getLivePeerUrl } from '../../../features/social/sceneAdapter'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useProfiles } from '../../../hooks/useProfiles'
import { getDisplayName } from '../../../utils/avatarColor'
import { Avatar } from '../../cast/Avatar/Avatar'
import {
  AvatarStack,
  EmptyState,
  MINI_AVATAR_SIZE,
  OverflowDisc,
  PersonAddress,
  PersonName,
  PopoverHeader,
  PopoverList,
  PopoverRow,
  PopoverShell,
  StackCount,
  StackSlot,
  StackTrigger
} from './PeopleStack.styled'

// Max avatars visible in the collapsed stack. Anything beyond folds into a
// "+N" disc on the right.
const MAX_VISIBLE = 4

interface ParticipantRow {
  identity: string
  address?: string
  profile?: Profile
}

// Mini avatar wrapper — keeps the bordered circle frame even while the
// underlying Avatar component renders fallback states.
function MiniAvatar({ profile, address, index }: { profile?: Profile; address?: string; index: number }) {
  return (
    <StackSlot $index={index}>
      <Avatar profile={profile} address={address} size={MINI_AVATAR_SIZE - 4} />
    </StackSlot>
  )
}

// Overlapping avatar stack + people count pill, anchored to the watcher cover.
// Click opens a popover listing every connected participant with their
// resolved name + truncated address.
//
// We fetch profiles directly for the participant list (not via ChatContext
// which only resolves chat-message senders). The underlying profile cache is
// shared, so this doesn't duplicate work — it just expands the lookup to
// every wallet in the room.
function PeopleStack() {
  const t = useFormatMessage()
  const participants = useRemoteParticipants()
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)

  const addresses = useMemo(() => {
    const out: string[] = []
    for (const p of participants) {
      if (p.identity?.startsWith('0x')) out.push(p.identity.toLowerCase())
    }
    return out
  }, [participants])

  const { profiles } = useProfiles(addresses, getLivePeerUrl())

  // Sort by profile quality so the most-identifiable users surface first:
  //   1. claimed names (paid / NFT-owned)
  //   2. deployed profiles with a custom name (no claim)
  //   3. address-only (no catalyst profile)
  // The avatar stack and the popover both use this order — keeps the limited
  // 4 visible thumbnails biased toward recognizable people.
  const rows = useMemo<ParticipantRow[]>(() => {
    const all = participants.map(p => {
      const address = p.identity?.startsWith('0x') ? p.identity.toLowerCase() : undefined
      return {
        identity: p.identity,
        address,
        profile: address ? profiles.get(address) : undefined
      }
    })
    const rank = (r: ParticipantRow): number => {
      if (r.profile?.hasClaimedName && r.profile.name) return 0
      if (r.profile?.name) return 1
      return 2
    }
    return [...all].sort((a, b) => rank(a) - rank(b))
  }, [participants, profiles])

  const total = rows.length
  const visible = rows.slice(0, MAX_VISIBLE)
  const overflow = Math.max(0, total - MAX_VISIBLE)

  if (total === 0) {
    return (
      <StackTrigger type="button" disabled aria-label={t('social.scene.people_count', { count: 0 })}>
        <AvatarStack>
          <StackSlot $index={0}>
            <Avatar size={MINI_AVATAR_SIZE - 4} />
          </StackSlot>
        </AvatarStack>
        <StackCount>{t('social.scene.people_count', { count: 0 })}</StackCount>
      </StackTrigger>
    )
  }

  return (
    <>
      <StackTrigger
        type="button"
        onClick={event => setAnchor(event.currentTarget)}
        aria-label={t('social.scene.people_count', { count: total })}
      >
        <AvatarStack>
          {visible.map((row, i) => (
            <MiniAvatar key={row.identity} profile={row.profile} address={row.address} index={i} />
          ))}
          {overflow > 0 && <OverflowDisc>+{overflow}</OverflowDisc>}
        </AvatarStack>
        <StackCount>{t('social.scene.people_count', { count: total })}</StackCount>
      </StackTrigger>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { background: 'transparent', overflow: 'visible', marginTop: 1 }
          }
        }}
      >
        <PopoverShell>
          <PopoverHeader>{t('social.scene.people_count', { count: total })}</PopoverHeader>
          <PopoverList>
            {rows.length === 0 ? (
              <EmptyState>{t('social.scene.people_empty')}</EmptyState>
            ) : (
              rows.map(row => <PersonRow key={row.identity} row={row} />)
            )}
          </PopoverList>
        </PopoverShell>
      </Popover>
    </>
  )
}

function PersonRow({ row }: { row: ParticipantRow }) {
  // Display priority:
  //   1. claimed name → "Alice"
  //   2. deployed name (no claim) → "alice#a1b2" (DCL convention)
  //   3. address fallback → "0x12…ab"
  // `getDisplayName` already implements 1 + 2; we just need a final address
  // fallback for wallets without any deployed profile data.
  const fromProfile = getDisplayName({
    name: row.profile?.name,
    hasClaimedName: row.profile?.hasClaimedName,
    ethAddress: row.address
  })
  const displayName = fromProfile || (row.address ? `${row.address.slice(0, 6)}…${row.address.slice(-4)}` : row.identity)
  const showShortAddress = !!row.profile?.name && !!row.address
  return (
    <PopoverRow>
      <Avatar profile={row.profile} address={row.address} size={32} />
      <PersonName>{displayName}</PersonName>
      {showShortAddress && <PersonAddress>{`${row.address!.slice(0, 4)}…${row.address!.slice(-4)}`}</PersonAddress>}
    </PopoverRow>
  )
}

export { PeopleStack }

import { useMemo } from 'react'
import { Participant } from 'livekit-client'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
]

const getAvatarColor = (identity: string): string => {
  const index = identity.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

const getParticipantRole = (participant: Participant): string | null => {
  try {
    const metadata = participant.metadata ? JSON.parse(participant.metadata) : {}
    return metadata.role || null
  } catch {
    return null
  }
}

const useFilteredParticipants = (allParticipants: Participant[]) => {
  const streamers = useMemo(() => allParticipants.filter(participant => getParticipantRole(participant) === 'streamer'), [allParticipants])
  const watchers = useMemo(() => allParticipants.filter(participant => getParticipantRole(participant) === 'watcher'), [allParticipants])
  return { streamers, watchers }
}

export { getAvatarColor, useFilteredParticipants }

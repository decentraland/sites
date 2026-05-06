/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useMemo } from 'react'
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react'
import CloseIcon from '@mui/icons-material/Close'
import { Participant, Track } from 'livekit-client'
import { getDisplayName } from '../../../features/cast2/cast2.utils'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { useFilteredParticipants } from '../../../hooks/usePeopleSidebar'
import { useProfiles } from '../../../hooks/useProfiles'
import { Avatar } from '../Avatar/Avatar'
import { PeopleSidebarProps } from './PeopleSidebar.type'
import {
  CloseButton,
  Divider,
  EmptyState,
  ParticipantInfo,
  ParticipantItem,
  ParticipantName,
  ParticipantStatus,
  Section,
  SectionCard,
  SectionCount,
  SectionHeader,
  SectionTitle,
  SidebarContainer,
  SidebarContent,
  SidebarHeader,
  SidebarTitle
} from './PeopleSidebar.styled'

export function PeopleSidebar({ onClose }: PeopleSidebarProps) {
  const { t } = useCastTranslation()
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useRemoteParticipants()

  const allParticipants = useMemo(() => {
    return localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants
  }, [localParticipant, remoteParticipants])

  const { streamers, watchers } = useFilteredParticipants(allParticipants)

  // Filter in-world participants (those without role in metadata)
  const inWorldParticipants = useMemo(() => {
    return remoteParticipants.filter(p => {
      try {
        const metadata = p.metadata ? JSON.parse(p.metadata) : null
        // In-world participants don't have a role in metadata
        return !metadata?.role
      } catch {
        // If metadata parsing fails, assume it's an in-world participant
        return true
      }
    })
  }, [remoteParticipants])

  // Extract addresses from all participants (including in-world participants)
  const addresses = useMemo(() => {
    const addressSet = new Set<string>()
    allParticipants.forEach(p => {
      try {
        const metadata = p.metadata ? JSON.parse(p.metadata) : null
        if (metadata?.address) {
          addressSet.add(metadata.address)
        }
      } catch {
        // Ignore parse errors
      }
    })
    // Also add addresses from in-world participants (they use identity as address)
    inWorldParticipants.forEach(p => {
      if (p.identity?.startsWith('0x')) {
        addressSet.add(p.identity)
      }
    })
    return Array.from(addressSet)
  }, [allParticipants, inWorldParticipants])

  // Get profiles for all participants
  const { profiles } = useProfiles(addresses)

  const getParticipantProfile = useCallback(
    (participant: Participant) => {
      let address: string | undefined
      let profile = null

      try {
        const metadata = participant.metadata ? JSON.parse(participant.metadata) : null
        address = metadata?.address

        // For in-world participants without role, use identity as address
        if (!metadata?.role && participant.identity?.startsWith('0x')) {
          address = participant.identity
        }

        if (address) {
          profile = profiles.get(address.toLowerCase())
        }
      } catch {
        // Ignore parse errors
      }

      const isLocalUser = localParticipant?.sid === participant.sid
      let displayName: string

      if (isLocalUser) {
        displayName = t('live_counter.you').toUpperCase()
      } else if (profile?.hasClaimedName && profile?.name) {
        // Use claimed profile name
        displayName = profile.name
      } else if (address?.startsWith('0x')) {
        // Truncate address: 0x1234...5678
        displayName = `${address.slice(0, 6)}...${address.slice(-4)}`
      } else {
        // Fallback to display name from metadata
        displayName = getDisplayName(participant)
      }

      // Check if participant is sharing screen
      const isScreenSharing = Array.from(participant.videoTrackPublications.values()).some(
        pub => pub.source === Track.Source.ScreenShare && pub.track
      )

      return { displayName, address, profile, isScreenSharing }
    },
    [localParticipant, profiles, t]
  )

  return (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarTitle>{t('people.title')}</SidebarTitle>
        <CloseButton onClick={onClose}>
          <CloseIcon />
        </CloseButton>
      </SidebarHeader>

      <SidebarContent>
        {/* Speakers Section */}
        <Section>
          <SectionCard>
            <SectionHeader>
              <SectionTitle>{t('people.speakers')}</SectionTitle>
              <SectionCount>{streamers.length}</SectionCount>
            </SectionHeader>
            <Divider />
            {streamers.length > 0 ? (
              streamers.map(participant => {
                const { address, profile, displayName, isScreenSharing } = getParticipantProfile(participant)

                return (
                  <ParticipantItem key={participant.sid}>
                    <Avatar profile={profile} address={address} size={40} />
                    <ParticipantInfo>
                      <ParticipantName>{displayName}</ParticipantName>
                      {isScreenSharing && <ParticipantStatus $isStreaming={true}>{t('people.speaker_status')}</ParticipantStatus>}
                    </ParticipantInfo>
                  </ParticipantItem>
                )
              })
            ) : (
              <EmptyState>{t('people.no_speakers')}</EmptyState>
            )}
          </SectionCard>
        </Section>

        {/* Viewers Section */}
        <Section>
          <SectionCard>
            <SectionHeader>
              <SectionTitle>{t('people.viewers')}</SectionTitle>
              <SectionCount>{watchers.length}</SectionCount>
            </SectionHeader>
            <Divider />
            {watchers.length > 0 ? (
              watchers.slice(0, 20).map(participant => {
                const { address, profile, displayName } = getParticipantProfile(participant)

                return (
                  <ParticipantItem key={participant.sid}>
                    <Avatar profile={profile} address={address} size={40} />
                    <ParticipantInfo>
                      <ParticipantName>{displayName}</ParticipantName>
                      <ParticipantStatus>{t('people.viewer_status')}</ParticipantStatus>
                    </ParticipantInfo>
                  </ParticipantItem>
                )
              })
            ) : (
              <EmptyState>{t('people.no_viewers')}</EmptyState>
            )}
            {watchers.length > 20 && <EmptyState>and {watchers.length - 20} more...</EmptyState>}
          </SectionCard>
        </Section>

        {/* In-World Participants Section */}
        <Section>
          <SectionCard>
            <SectionHeader>
              <SectionTitle>{t('people.in_world_participants')}</SectionTitle>
              <SectionCount>{inWorldParticipants.length}</SectionCount>
            </SectionHeader>
            <Divider />
            {inWorldParticipants.length > 0 ? (
              inWorldParticipants.slice(0, 20).map(participant => {
                const { address, profile, displayName } = getParticipantProfile(participant)

                return (
                  <ParticipantItem key={participant.sid}>
                    <Avatar profile={profile} address={address} size={40} />
                    <ParticipantInfo>
                      <ParticipantName>{displayName}</ParticipantName>
                      <ParticipantStatus>{t('people.in_world_status')}</ParticipantStatus>
                    </ParticipantInfo>
                  </ParticipantItem>
                )
              })
            ) : (
              <EmptyState>{t('people.no_in_world')}</EmptyState>
            )}
            {inWorldParticipants.length > 20 && <EmptyState>and {inWorldParticipants.length - 20} more...</EmptyState>}
          </SectionCard>
        </Section>
      </SidebarContent>
    </SidebarContainer>
  )
}

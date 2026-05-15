import type { Profile } from '../../../features/profile/profile.client'

interface OverviewTabProps {
  address: string
  isOwnProfile: boolean
}

type AvatarSnapshot = NonNullable<NonNullable<Profile['avatars']>[number]>

interface InfoField {
  labelKey: string
  value: string | undefined
}

interface ProfileLink {
  title?: string
  url: string
}

export type { AvatarSnapshot, InfoField, OverviewTabProps, ProfileLink }

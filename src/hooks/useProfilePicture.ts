import { useGetProfileQuery } from '../features/profile/profile.client'

function useProfilePicture(address: string | undefined): string {
  const { data: profile } = useGetProfileQuery(address, { skip: !address })
  return profile?.avatars?.[0]?.avatar?.snapshots?.face256 ?? ''
}

export { useProfilePicture }

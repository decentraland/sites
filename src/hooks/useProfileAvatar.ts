import { useEffect, useMemo, useState } from 'react'
import { useGetProfileQuery } from '../features/profile/profile.client'
import type { Profile } from '../features/profile/profile.client'

type ProfileAvatarsItem = NonNullable<Profile['avatars']>[number]

type UseProfileAvatarResult = {
  avatar: ProfileAvatarsItem | undefined
  avatarForCard: ProfileAvatarsItem | undefined
  avatarFace: string | undefined
  name: string | undefined
}

type QueryOptions = { skip?: boolean }

// Catalyst's `snapshots.face256` occasionally points at an IPFS hash whose image
// was never deployed (or was removed) from the profile-images bucket. The CDN
// redirects to an S3 404 XML response which the browser blocks via ORB — the
// browser surfaces this as a standard Image `error` event. Cache broken URLs in
// memory so consumers fall back to the placeholder avatar consistently. A FIFO
// cap bounds memory and gives a recovery path: once exceeded we evict the oldest
// entry so a transient CDN outage doesn't permanently mark every avatar as broken.
const BROKEN_CACHE_MAX_SIZE = 500
const brokenFaceUrls = new Set<string>()

function markFaceAsBroken(url: string): void {
  if (brokenFaceUrls.size >= BROKEN_CACHE_MAX_SIZE) {
    const oldest = brokenFaceUrls.values().next().value
    if (oldest !== undefined) brokenFaceUrls.delete(oldest)
  }
  brokenFaceUrls.add(url)
}

function useProfileAvatar(address: string | undefined, options: QueryOptions = {}): UseProfileAvatarResult {
  const { data: profile } = useGetProfileQuery(address, options)
  const avatar = profile?.avatars?.[0]
  const rawFace = avatar?.avatar?.snapshots?.face256
  const [broken, setBroken] = useState<boolean>(() => (rawFace ? brokenFaceUrls.has(rawFace) : false))

  useEffect(() => {
    if (!rawFace) {
      setBroken(false)
      return
    }
    if (brokenFaceUrls.has(rawFace)) {
      setBroken(true)
      return
    }
    setBroken(false)
    const img = new Image()
    let cancelled = false
    img.onerror = () => {
      if (cancelled) return
      markFaceAsBroken(rawFace)
      setBroken(true)
    }
    img.src = rawFace
    return () => {
      cancelled = true
      img.onerror = null
      // Setting src to an empty string aborts the in-flight request so the image
      // fetch doesn't outlive the component that requested it.
      img.src = ''
    }
  }, [rawFace])

  const avatarFace = !rawFace || broken ? undefined : rawFace

  const avatarForCard = useMemo<ProfileAvatarsItem | undefined>(() => {
    if (!avatar) return undefined
    if (!avatar.avatar) return avatar
    if (avatar.avatar.snapshots?.face256 === avatarFace) return avatar
    return {
      ...avatar,
      avatar: {
        ...avatar.avatar,
        snapshots: { ...avatar.avatar.snapshots, face256: avatarFace }
      }
    }
  }, [avatar, avatarFace])

  return {
    avatar,
    avatarForCard,
    avatarFace,
    name: avatar?.name
  }
}

export { useProfileAvatar }
export type { UseProfileAvatarResult }

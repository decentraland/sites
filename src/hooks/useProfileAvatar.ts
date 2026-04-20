import { useEffect, useState } from 'react'
import { useGetProfileQuery } from '../features/profile/profile.client'
import type { Profile } from '../features/profile/profile.client'

type ProfileAvatarsItem = NonNullable<Profile['avatars']>[number]

type UseProfileAvatarResult = {
  avatar: ProfileAvatarsItem | undefined
  avatarFace: string | undefined
  name: string | undefined
}

type QueryOptions = { skip?: boolean }

// Catalyst's `snapshots.face256` occasionally points at an IPFS hash whose image
// was never deployed (or was removed) from the profile-images bucket. The CDN
// redirects to an S3 404 XML response which the browser blocks via ORB — the
// browser surfaces this as a standard Image `error` event. Cache broken URLs in
// memory so consumers fall back to the placeholder avatar consistently. The cap
// bounds memory and gives a recovery path: once exceeded we drop the cache so a
// transient CDN outage doesn't permanently mark every avatar as broken.
const BROKEN_CACHE_MAX_SIZE = 500
const brokenFaceUrls = new Set<string>()

function markFaceAsBroken(url: string): void {
  if (brokenFaceUrls.size >= BROKEN_CACHE_MAX_SIZE) brokenFaceUrls.clear()
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
    }
  }, [rawFace])

  return {
    avatar,
    avatarFace: !rawFace || broken ? undefined : rawFace,
    name: avatar?.name
  }
}

export { useProfileAvatar }
export type { UseProfileAvatarResult }
